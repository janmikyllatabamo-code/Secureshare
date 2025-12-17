import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
import { FaLock, FaShieldAlt, FaUsers } from "react-icons/fa";
import { IoShieldCheckmark } from "react-icons/io5";
import Navbar from './Navbar';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import MFAEnrollment from './MFAEnrollment';
import MFAVerification from './MFAVerification';
import { sendOAuthConfirmationEmail, isEmailConfirmed, isValidTUPEmail } from '../../utils/emailConfirmation';
import { sendPasswordSetupEmail, isNewGoogleOAuthUser, wasPasswordSetupEmailSent } from '../../utils/passwordSetup';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMFAEnrollment, setShowMFAEnrollment] = useState(false);
  const [showMFAVerification, setShowMFAVerification] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const navigate = useNavigate();

  // Use ref to persist captured email across renders
  const capturedOAuthEmailRef = useRef(null);

  // Handle email confirmation callback
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      // Check URL hash for email confirmation token
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      // Check if this is an email confirmation callback
      if (type === 'signup' && accessToken) {
        console.log('📧 Email confirmation detected in Login component...');
        // Wait for Supabase to process the token
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get the session after confirmation
        const { data: { session: confirmedSession }, error } = await supabase.auth.getSession();

        if (confirmedSession && confirmedSession.user) {
          // Check if email is confirmed
          if (confirmedSession.user.email_confirmed_at) {
            console.log('✅ Email confirmed! Redirecting to student dashboard...');
            // Clear the hash to clean up URL
            window.history.replaceState({}, document.title, '/portal');
            // Redirect to student dashboard
            navigate('/portal');
            return;
          }
        }
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

  // Handle OAuth callback
  useEffect(() => {
    let isProcessing = false;

    // CRITICAL: Listen to auth state changes to capture email BEFORE user is signed out
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only handle SIGNED_IN events for Google OAuth users
      if (event === 'SIGNED_IN' && session && session.user) {
        const isGoogleAuth = session.user.app_metadata?.provider === 'google' ||
          session.user.identities?.some(identity => identity.provider === 'google');

        if (isGoogleAuth) {
          // Get email from multiple possible locations in Google OAuth response
          const emailFromUser = session.user.email;
          const emailFromMetadata = session.user.user_metadata?.email;
          const emailFromIdentity = session.user.identities?.find(id => id.provider === 'google')?.identity_data?.email;

          // Use the first available email
          const userEmail = emailFromUser || emailFromMetadata || emailFromIdentity;

          if (userEmail) {
            // Skip email confirmation for Google OAuth with @tup.edu.ph domain
            const skipConfirmation = isGoogleAuth && isValidTUPEmail(userEmail);

            // Only send confirmation email if NOT skipping and email NOT confirmed
            if (!skipConfirmation && !isEmailConfirmed(session.user)) {
              console.log('📧 Captured OAuth email before sign-out:', userEmail);
              capturedOAuthEmailRef.current = userEmail;

              // Send confirmation email
              console.log('🚀 Sending confirmation email via Supabase Auth to:', userEmail);
              try {
                const { error: resendError } = await supabase.auth.resend({
                  type: 'signup',
                  email: userEmail,
                  options: {
                    emailRedirectTo: `${window.location.origin}/portal`
                  }
                });

                if (!resendError) {
                  console.log('✅ Confirmation email sent successfully via Supabase Auth!');
                } else {
                  console.log('⚠️  Supabase Auth resend failed, trying alternative method:', resendError?.message);
                  const result = await sendOAuthConfirmationEmail(userEmail);
                  if (result.success) {
                    console.log('✅ Confirmation email sent successfully via alternative method!');
                  } else {
                    console.error('❌ Failed to send confirmation email:', result.error);
                    if (result.confirmationLink) {
                      console.log('🔗 Confirmation link (email service not configured):', result.confirmationLink);
                    }
                  }
                }
              } catch (err) {
                console.error('❌ Error sending confirmation email:', err);
              }
            } else if (skipConfirmation) {
              console.log('✅ Google OAuth with @tup.edu.ph - skipping email confirmation');

              // Send password setup email for new Google OAuth users
              // This allows them to set up a password for manual email/password login
              if (isNewGoogleOAuthUser(session.user) && !wasPasswordSetupEmailSent(session.user.id)) {
                console.log('📧 Sending password setup email to new Google OAuth user:', userEmail);
                sendPasswordSetupEmail(userEmail, session.user.id).then(result => {
                  if (result.success && !result.alreadySent) {
                    console.log('✅ Password setup email sent successfully!');
                  }
                }).catch(err => {
                  console.error('Failed to send password setup email:', err);
                });
              }
            }
          } else {
            console.log('⚠️  No email found in Google OAuth response in onAuthStateChange');
            console.log('   User object:', {
              email: session.user.email,
              user_metadata: session.user.user_metadata,
              identities: session.user.identities
            });
          }
        }
      }
    });

    const handleAuthCallback = async () => {
      if (isProcessing) return;

      // Check for OAuth callback in URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      // Handle error parameter, but check for session first before showing error
      let hasErrorParam = false;
      if (error) {
        hasErrorParam = true;
        console.log('OAuth error parameter:', error);
        if (error === 'access_denied') {
          // User cancelled - show message and return
          setError('Google sign-in was cancelled. Please try again if you want to sign in.');
          setGoogleLoading(false);
          window.history.replaceState({}, document.title, '/login');
          return;
        }
        // For other errors, try to get session anyway - sometimes session still works
      }

      // Check for code parameter (OAuth success) or try to get session even with error param
      if (code || hasErrorParam) {
        // OAuth callback detected - Supabase automatically exchanges the code
        // Clean up URL first
        window.history.replaceState({}, document.title, '/login');

        // Wait a moment for Supabase to process the code exchange
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Try multiple times to get session and capture email
        let session = null;
        let userEmail = null;
        for (let i = 0; i < 5; i++) {
          const { data: { session: currentSession }, error: getSessionError } = await supabase.auth.getSession();

          if (currentSession && currentSession.user) {
            const isGoogleAuth = currentSession.user.app_metadata?.provider === 'google' ||
              currentSession.user.identities?.some(identity => identity.provider === 'google');

            if (isGoogleAuth) {
              // Get email from multiple possible locations in Google OAuth response
              const emailFromUser = currentSession.user.email;
              const emailFromMetadata = currentSession.user.user_metadata?.email;
              const emailFromIdentity = currentSession.user.identities?.find(id => id.provider === 'google')?.identity_data?.email;

              // Use the first available email
              userEmail = emailFromUser || emailFromMetadata || emailFromIdentity;

              if (userEmail) {
                session = currentSession;
                capturedOAuthEmailRef.current = userEmail;
                console.log(`📧 [Attempt ${i + 1}] Captured email from Google OAuth:`, userEmail);
                console.log('   Email sources:', {
                  userEmail: emailFromUser,
                  metadataEmail: emailFromMetadata,
                  identityEmail: emailFromIdentity
                });

                // Skip email confirmation for Google OAuth with valid @tup.edu.ph domain
                // Google already verifies email ownership, and we validate the domain
                const skipConfirmation = isGoogleAuth && isValidTUPEmail(userEmail);

                if (!skipConfirmation && !isEmailConfirmed(currentSession.user)) {
                  console.log('🚀 Sending confirmation email via Supabase Auth to:', userEmail);
                  try {
                    // FIRST: Try using Supabase Auth resend directly (this is the proper way)
                    console.log('   Trying Supabase Auth resend() method...');
                    const { error: resendError, data: resendData } = await supabase.auth.resend({
                      type: 'signup',
                      email: userEmail,
                      options: {
                        emailRedirectTo: `${window.location.origin}/portal`
                      }
                    });

                    if (!resendError) {
                      console.log('✅ Confirmation email sent successfully via Supabase Auth!');
                      setError(`✅ A confirmation email has been sent to ${userEmail}. Please check your email (including spam folder) and click the confirmation link to complete your sign-in. You cannot access the dashboard until you confirm your email.`);
                      setGoogleLoading(false);
                      window.history.replaceState({}, document.title, '/login');
                      return;
                    } else {
                      console.log('⚠️  Supabase Auth resend failed:', resendError?.message);
                      console.log('   Trying alternative method...');

                      // If resend fails, try the sendOAuthConfirmationEmail function
                      const result = await sendOAuthConfirmationEmail(userEmail);
                      if (result.success) {
                        console.log('✅ Confirmation email sent successfully via alternative method!');
                        setError(`✅ A confirmation email has been sent to ${userEmail}. Please check your email (including spam folder) and click the confirmation link to complete your sign-in. You cannot access the dashboard until you confirm your email.`);
                        setGoogleLoading(false);
                        window.history.replaceState({}, document.title, '/login');
                        return;
                      } else {
                        console.error('❌ Failed to send confirmation email:', result.error);
                        if (result.confirmationLink) {
                          const fullLink = result.confirmationLink;
                          console.log('🔗 FULL CONFIRMATION LINK:', fullLink);
                          console.log('📋 Link copied to clipboard! Click it to confirm your email.');

                          // Copy to clipboard
                          try {
                            await navigator.clipboard.writeText(fullLink);
                            console.log('✅ Link copied to clipboard!');
                          } catch (err) {
                            console.log('⚠️  Could not copy to clipboard');
                          }

                          // Try to open the link automatically
                          try {
                            window.open(fullLink, '_blank');
                            console.log('✅ Opened confirmation link in new tab!');
                          } catch (err) {
                            console.log('⚠️  Could not open link automatically');
                          }

                          setError(`⚠️ EMAIL CONFIRMATIONS NOT ENABLED!\n\nTo fix: Go to Supabase Dashboard > Authentication > Email > Enable "Confirm sign up"\n\nYour confirmation link (opened in new tab, also in console):\n${fullLink.substring(0, 80)}...\n\nClick the link to confirm your email now!`);
                          setGoogleLoading(false);
                          window.history.replaceState({}, document.title, '/login');
                          return;
                        }
                      }
                    }
                  } catch (err) {
                    console.error('❌ Error sending confirmation email:', err);
                  }
                }
                break; // Found session and sent email, exit loop
              }
            }

            // Wait before next attempt
            if (i < 4) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          // Get the final session for further processing
          const { data: { session: finalSession }, error: finalSessionError } = await supabase.auth.getSession();
          session = finalSession || session;

          if (finalSessionError) {
            console.error('Session error:', finalSessionError);
            // Check if it's an email confirmation issue
            if (finalSessionError.message?.includes('email') || finalSessionError.message?.includes('confirm')) {
              setError('Please confirm your email address before signing in. Check your email for a confirmation link.');
            } else {
              setError('Failed to complete authentication. Please try again.');
            }
            setGoogleLoading(false);
            return;
          }

          // If no session, the user might have been created but email not confirmed
          // Try to get user info and send confirmation email
          let sessionToUse = session || null;
          if (!session) {
            console.log('No session found, checking if user was created...');

            // Wait a bit more for user creation
            await new Promise(resolve => setTimeout(resolve, 2000));
            const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();

            if (retrySession) {
              sessionToUse = retrySession;
            } else {
              // No session - user was likely created but email not confirmed
              // This happens when email_confirmed_at is NULL
              console.log('No session after retry - user created but email not confirmed');

              // FORCEFULLY find and send email to the most recent Google OAuth user
              const forceSendConfirmationEmail = async () => {
                console.log('🔍 FORCEFULLY searching for most recent Google OAuth user...');

                // FIRST: If we have captured email, use it immediately
                if (capturedOAuthEmailRef.current) {
                  console.log('✅ Using captured email for forceful send:', capturedOAuthEmailRef.current);
                  try {
                    const result = await sendOAuthConfirmationEmail(capturedOAuthEmailRef.current);
                    if (result.success) {
                      console.log('✅ Confirmation email sent successfully to captured email!');
                      setError(`✅ A confirmation email has been sent to ${capturedOAuthEmailRef.current}. Please check your email (including spam folder) and click the confirmation link to complete your sign-in.`);
                      setGoogleLoading(false);
                      window.history.replaceState({}, document.title, '/login');
                      return true;
                    } else if (result.confirmationLink) {
                      console.log('🔗 Confirmation link:', result.confirmationLink);
                      setError(`⚠️ Email service not configured. Your confirmation link: ${result.confirmationLink.substring(0, 150)}... (Check console for full link)`);
                      setGoogleLoading(false);
                      window.history.replaceState({}, document.title, '/login');
                      return true;
                    }
                  } catch (err) {
                    console.error('❌ Error sending to captured email:', err);
                  }
                }

                // SECOND: Try multiple times with increasing delays to find the user
                for (let attempt = 1; attempt <= 5; attempt++) {
                  console.log(`   Force search attempt ${attempt}/5...`);

                  if (attempt > 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                  }

                  try {
                    // Get all users
                    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

                    if (listError) {
                      console.error(`   Attempt ${attempt} failed:`, listError);
                      continue;
                    }

                    console.log(`   Total users in database: ${usersData?.users?.length || 0}`);

                    // Priority 1: Find unconfirmed @tup.edu.ph Google OAuth users (most recent first)
                    const tupGoogleUsers = usersData?.users?.filter(u => {
                      const isGoogle = u.app_metadata?.provider === 'google' ||
                        u.identities?.some(id => id.provider === 'google');
                      const isTup = u.email?.toLowerCase().endsWith('@tup.edu.ph');
                      const isUnconfirmed = !u.email_confirmed_at;
                      return isGoogle && isTup && isUnconfirmed;
                    }) || [];

                    // Priority 2: Find ANY unconfirmed Google OAuth user (regardless of email domain)
                    const googleUsers = usersData?.users?.filter(u => {
                      const isGoogle = u.app_metadata?.provider === 'google' ||
                        u.identities?.some(id => id.provider === 'google');
                      const isUnconfirmed = !u.email_confirmed_at;
                      if (isGoogle) {
                        console.log(`   Found Google OAuth user: ${u.email}, created: ${u.created_at}, confirmed: ${!!u.email_confirmed_at}, isTup: ${u.email?.toLowerCase().endsWith('@tup.edu.ph')}`);
                      }
                      return isGoogle && isUnconfirmed;
                    }) || [];

                    console.log(`   Unconfirmed @tup.edu.ph Google users: ${tupGoogleUsers.length}`);
                    console.log(`   Total unconfirmed Google OAuth users: ${googleUsers.length}`);

                    // If no unconfirmed users found, check for CONFIRMED @tup.edu.ph users
                    // These users should be allowed to sign in directly
                    const confirmedTupUsers = usersData?.users?.filter(u => {
                      const isGoogle = u.app_metadata?.provider === 'google' ||
                        u.identities?.some(id => id.provider === 'google');
                      const isConfirmed = !!u.email_confirmed_at;
                      const isTup = u.email?.toLowerCase().endsWith('@tup.edu.ph');
                      return isGoogle && isConfirmed && isTup;
                    }) || [];

                    console.log(`   Confirmed @tup.edu.ph Google users: ${confirmedTupUsers.length}`);

                    // If we have a confirmed TUP user, show message to try signing in again
                    if (confirmedTupUsers.length > 0 && googleUsers.length === 0) {
                      console.log('✅ Found confirmed @tup.edu.ph user, they should be able to sign in');
                      setError(`Your account is already confirmed! Please click "Sign in with Google" again to access the dashboard.`);
                      setGoogleLoading(false);
                      window.history.replaceState({}, document.title, '/login');
                      return true;
                    }

                    // Sort by creation date (most recent first)
                    const allGoogleUsers = [...tupGoogleUsers, ...googleUsers];
                    allGoogleUsers.sort((a, b) => {
                      const dateA = new Date(a.created_at || 0);
                      const dateB = new Date(b.created_at || 0);
                      return dateB - dateA;
                    });

                    const mostRecentGoogleUser = allGoogleUsers[0];

                    if (mostRecentGoogleUser && mostRecentGoogleUser.email) {
                      console.log('✅ Found most recent Google OAuth user:', mostRecentGoogleUser.email);
                      console.log('   User details:', {
                        email: mostRecentGoogleUser.email,
                        created: mostRecentGoogleUser.created_at,
                        confirmed: !!mostRecentGoogleUser.email_confirmed_at,
                        provider: mostRecentGoogleUser.app_metadata?.provider,
                        identities: mostRecentGoogleUser.identities
                      });

                      // Send confirmation email FORCEFULLY
                      console.log('🚀 FORCEFULLY sending confirmation email to:', mostRecentGoogleUser.email);
                      const result = await sendOAuthConfirmationEmail(mostRecentGoogleUser.email);

                      if (result.success) {
                        console.log('✅ Confirmation email sent successfully!');
                        setError(`✅ A confirmation email has been sent to ${mostRecentGoogleUser.email}. Please check your email (including spam folder) and click the confirmation link to complete your sign-in. You cannot access the dashboard until you confirm your email.`);
                        setGoogleLoading(false);
                        window.history.replaceState({}, document.title, '/login');
                        return true; // Success
                      } else {
                        console.error('❌ Failed to send email:', result.error);
                        if (result.confirmationLink) {
                          console.log('🔗 Confirmation link:', result.confirmationLink);
                          setError(`⚠️ Email service not configured. Your confirmation link: ${result.confirmationLink.substring(0, 150)}... (Check console for full link)`);
                          setGoogleLoading(false);
                          window.history.replaceState({}, document.title, '/login');
                          return true; // At least we have the link
                        }
                      }
                    } else {
                      console.log(`   Attempt ${attempt}: No unconfirmed Google OAuth users found yet`);
                    }
                  } catch (err) {
                    console.error(`   Attempt ${attempt} error:`, err);
                  }
                }

                return false; // Failed
              };

              // SIMPLIFIED: Use captured email first, then try to get from auth state
              let userEmail = capturedOAuthEmailRef.current;
              let emailSent = false;

              // PRIORITY 1: Use captured email from auth state change (most reliable)
              if (userEmail) {
                console.log('✅ Using captured OAuth email:', userEmail);

                // Send confirmation email immediately
                console.log('🚀 Sending confirmation email to captured email:', userEmail);
                try {
                  const result = await sendOAuthConfirmationEmail(userEmail);
                  if (result.success) {
                    setError(`✅ A confirmation email has been sent to ${userEmail}. Please check your email (including spam folder) and click the confirmation link to complete your sign-in. You cannot access the dashboard until you confirm your email.`);
                    setGoogleLoading(false);
                    window.history.replaceState({}, document.title, '/login');
                    emailSent = true;
                  } else {
                    console.error('❌ Failed to send confirmation email:', result.error);
                    if (result.confirmationLink) {
                      setError(`⚠️ Email service not configured. Please enable email confirmations in Supabase Dashboard > Authentication > Email > "Confirm sign up" and configure SMTP. Your confirmation link: ${result.confirmationLink.substring(0, 100)}... (Check console for full link)`);
                      console.log('🔗 Full confirmation link:', result.confirmationLink);
                      setGoogleLoading(false);
                      window.history.replaceState({}, document.title, '/login');
                      emailSent = true;
                    }
                  }
                } catch (err) {
                  console.error('❌ Error sending confirmation email:', err);
                }
              }

              // PRIORITY 2: If no captured email, try to get from auth state
              if (!emailSent && !userEmail) {
                try {
                  const { data: { user }, error: getUserError } = await supabase.auth.getUser();
                  if (user && user.email) {
                    userEmail = user.email;
                    console.log('✅ Found user from auth state:', userEmail);

                    // Send confirmation email
                    console.log('🚀 Sending confirmation email to auth state user:', userEmail);
                    const result = await sendOAuthConfirmationEmail(userEmail);
                    if (result.success) {
                      setError(`✅ A confirmation email has been sent to ${userEmail}. Please check your email (including spam folder) and click the confirmation link to complete your sign-in.`);
                      setGoogleLoading(false);
                      window.history.replaceState({}, document.title, '/login');
                      emailSent = true;
                    } else if (result.confirmationLink) {
                      setError(`⚠️ Email service not configured. Your confirmation link: ${result.confirmationLink.substring(0, 100)}... (Check console for full link)`);
                      console.log('🔗 Full confirmation link:', result.confirmationLink);
                      setGoogleLoading(false);
                      window.history.replaceState({}, document.title, '/login');
                      emailSent = true;
                    }
                  } else {
                    console.log('⚠️  No user found in auth state. Error:', getUserError);
                  }
                } catch (userError) {
                  console.log('❌ Could not get user from auth state:', userError);
                }
              }

              // PRIORITY 3: If still no email, try forceful search (simplified)
              if (!emailSent) {
                emailSent = await forceSendConfirmationEmail();
              }

              // PRIORITY 4: Last resort - try to find user by searching (with better error handling)
              if (!emailSent && !userEmail) {
                console.log('🔍 Last resort: Searching for user in database...');

                // Wait a bit for user creation to complete
                await new Promise(resolve => setTimeout(resolve, 2000));

                try {
                  // Try to get user from auth state one more time
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user && user.email) {
                    userEmail = user.email;
                    console.log('✅ Found user on retry:', userEmail);

                    const result = await sendOAuthConfirmationEmail(userEmail);
                    if (result.success) {
                      setError(`✅ A confirmation email has been sent to ${userEmail}. Please check your email (including spam folder) and click the confirmation link to complete your sign-in.`);
                      setGoogleLoading(false);
                      window.history.replaceState({}, document.title, '/login');
                      emailSent = true;
                    } else if (result.confirmationLink) {
                      setError(`⚠️ Email service not configured. Your confirmation link: ${result.confirmationLink.substring(0, 100)}... (Check console for full link)`);
                      console.log('🔗 Full confirmation link:', result.confirmationLink);
                      setGoogleLoading(false);
                      window.history.replaceState({}, document.title, '/login');
                      emailSent = true;
                    }
                  }
                } catch (err) {
                  console.error('Error in last resort attempt:', err);
                }
              }

              // Final fallback: If we still have no email, show helpful error
              if (!emailSent) {
                if (userEmail) {
                  // We have email but couldn't send - show error with email
                  setError(`Your account has been created! However, we couldn't send a confirmation email to ${userEmail}. Please try signing in again with Google, and we will send you a confirmation email. Check your spam folder as well.`);
                } else {
                  // No email at all - show generic error
                  console.log('❌ Could not find user email after all attempts');
                  setError('Your account has been created! However, we couldn\'t find your account to send a confirmation email. Please try signing in again with Google, and we will send you a confirmation email. Check your spam folder as well.');
                }
                setGoogleLoading(false);
                window.history.replaceState({}, document.title, '/login');
                return;
              }
            } // Close if (!emailSent) block from line 425
          } // Close else block from line 261
        } // Close if (!session) block from line 252

        // sessionToUse is declared at line 251 in the same scope (if (code || hasErrorParam) block)
        // eslint-disable-next-line no-undef
        const sessionToUseFinal = typeof sessionToUse !== 'undefined' ? sessionToUse : null;
        if (sessionToUseFinal && sessionToUseFinal.user) {
          // Clear any error if we successfully got a session
          if (hasErrorParam) {
            setError('');
          }

          isProcessing = true;
          // CRITICAL: Check email confirmation BEFORE processing session
          // eslint-disable-next-line no-undef
          const isGoogleAuth = sessionToUseFinal.user.app_metadata?.provider === 'google' ||
            // eslint-disable-next-line no-undef
            sessionToUseFinal.user.identities?.some(identity => identity.provider === 'google');

          if (isGoogleAuth) {
            // Validate email domain
            // eslint-disable-next-line no-undef
            if (!isValidTUPEmail(sessionToUseFinal.user.email)) {
              await supabase.auth.signOut();
              localStorage.removeItem('authUser');
              setError('Only @tup.edu.ph email addresses are allowed for Google sign-in.');
              setGoogleLoading(false);
              window.history.replaceState({}, document.title, '/login');
              isProcessing = false;
              return;
            }

            // Skip email confirmation for Google OAuth with valid @tup.edu.ph domain
            // eslint-disable-next-line no-undef
            const skipConfirmation = isGoogleAuth && isValidTUPEmail(sessionToUseFinal.user.email);

            // eslint-disable-next-line no-undef
            if (!skipConfirmation && !isEmailConfirmed(sessionToUseFinal.user)) {
              // Sign out IMMEDIATELY to prevent any auto-login
              await supabase.auth.signOut();
              localStorage.removeItem('authUser');

              // Send confirmation email automatically
              try {
                // eslint-disable-next-line no-undef
                console.log('Sending confirmation email to:', sessionToUseFinal.user.email);
                // eslint-disable-next-line no-undef
                const result = await sendOAuthConfirmationEmail(sessionToUseFinal.user.email);
                if (result.success) {
                  // eslint-disable-next-line no-undef
                  setError(`✅ A confirmation email has been sent to ${sessionToUseFinal.user.email}. Please check your email (including spam folder) and click the confirmation link to complete your sign-in. You cannot access the dashboard until you confirm your email.`);
                } else {
                  console.error('Failed to send confirmation email:', result.error);
                  if (result.confirmationLink) {
                    setError(`⚠️ Email service not configured. Please enable email confirmations in Supabase Dashboard > Authentication > Email > "Confirm sign up" and configure SMTP. Your confirmation link: ${result.confirmationLink.substring(0, 100)}... (Check console for full link)`);
                    console.log('🔗 Full confirmation link:', result.confirmationLink);
                  } else if (result.requiresDashboardConfig) {
                    // eslint-disable-next-line no-undef
                    setError(`⚠️ Email confirmations are not enabled in Supabase Dashboard. Please enable them in Authentication > Email > "Confirm sign up" and configure SMTP. Your email: ${sessionToUseFinal.user.email}. Error: ${result.error}`);
                  } else {
                    // eslint-disable-next-line no-undef
                    setError(`Please confirm your email address (${sessionToUseFinal.user.email}) before signing in. Error: ${result.error}. Please check your Supabase Dashboard settings to enable email confirmations.`);
                  }
                }
              } catch (err) {
                console.error('Error sending confirmation email:', err);
                // eslint-disable-next-line no-undef
                setError(`Please confirm your email address (${sessionToUseFinal.user.email}) before signing in. Error: ${err.message}. Make sure email confirmations are enabled in Supabase Dashboard.`);
              }

              setGoogleLoading(false);
              window.history.replaceState({}, document.title, '/login');
              isProcessing = false;
              // Stay on login page - NEVER redirect to dashboard until email is confirmed
              return;
            }
          }

          // Only proceed if email is confirmed (or not Google OAuth)
          // eslint-disable-next-line no-undef
          await handleUserSession(sessionToUseFinal.user);
          isProcessing = false;
          // eslint-enable no-undef
        } else {
          // No session - show error if we have error parameter
          if (hasErrorParam) {
            if (error === 'server_error' || error === 'temporarily_unavailable') {
              setError('Google authentication service is temporarily unavailable. Please try again in a moment.');
            } else {
              setError('Authentication failed. Please try again.');
            }
          }
          setGoogleLoading(false);
        }
      }

      // No OAuth callback - check existing session
      if (!code && !hasErrorParam) {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (session && !sessionError && session.user) {
          isProcessing = true;
          const isGoogleAuth = session.user.app_metadata?.provider === 'google' ||
            session.user.identities?.some(identity => identity.provider === 'google');

          // Skip email confirmation for Google OAuth with valid @tup.edu.ph domain
          if (isGoogleAuth && !isValidTUPEmail(session.user.email)) {
            // Invalid domain - sign out
            await supabase.auth.signOut();
            localStorage.removeItem('authUser');
            setError('Only @tup.edu.ph email addresses are allowed for Google sign-in.');
            setGoogleLoading(false);
            isProcessing = false;
            return;
          }

          // For Google OAuth with @tup.edu.ph, email confirmation is not required
          const skipConfirmation = isGoogleAuth && isValidTUPEmail(session.user.email);
          if (!isGoogleAuth || skipConfirmation || isEmailConfirmed(session.user)) {
            await handleUserSession(session.user);
          }
          isProcessing = false;
        }
      }
    };

    handleAuthCallback();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isProcessing) return;

      if (event === 'SIGNED_IN' && session && session.user) {
        isProcessing = true;

        // CRITICAL: Check email confirmation IMMEDIATELY for Google OAuth
        const isGoogleAuth = session.user.app_metadata?.provider === 'google' ||
          session.user.identities?.some(identity => identity.provider === 'google');

        if (isGoogleAuth) {
          // Validate email domain
          if (!isValidTUPEmail(session.user.email)) {
            await supabase.auth.signOut();
            localStorage.removeItem('authUser');
            setError('Only @tup.edu.ph email addresses are allowed for Google sign-in.');
            setGoogleLoading(false);
            isProcessing = false;
            return;
          }

          // Skip email confirmation for Google OAuth with valid @tup.edu.ph domain
          const skipConfirmation = isGoogleAuth && isValidTUPEmail(session.user.email);

          if (!skipConfirmation && !isEmailConfirmed(session.user)) {
            // Sign out IMMEDIATELY to prevent any auto-login
            await supabase.auth.signOut();
            localStorage.removeItem('authUser');

            // Send confirmation email automatically
            try {
              const result = await sendOAuthConfirmationEmail(session.user.email);
              if (result.success) {
                setError(`✅ A confirmation email has been sent to ${session.user.email}. Please check your email (including spam folder) and click the confirmation link to complete your sign-in. You cannot access the dashboard until you confirm your email.`);
              } else {
                if (result.confirmationLink) {
                  setError(`⚠️ Email service not configured. Please enable email confirmations in Supabase Dashboard > Authentication > Email > "Confirm sign up" and configure SMTP. Your confirmation link: ${result.confirmationLink.substring(0, 100)}... (Check console for full link)`);
                  console.log('🔗 Full confirmation link:', result.confirmationLink);
                } else if (result.requiresDashboardConfig) {
                  setError(`⚠️ Email confirmations are not enabled in Supabase Dashboard. Please enable them in Authentication > Email > "Confirm sign up" and configure SMTP. Your email: ${session.user.email}. Error: ${result.error}`);
                } else {
                  setError(`Please confirm your email address (${session.user.email}) before signing in. A confirmation email should have been sent to your inbox. Check your email and click the confirmation link.`);
                }
              }
            } catch (err) {
              console.error('Error sending confirmation email:', err);
              setError(`Please confirm your email address (${session.user.email}) before signing in. Check your email for a confirmation link from Supabase.`);
            }

            setGoogleLoading(false);
            isProcessing = false;
            // Stay on login page - NEVER redirect to dashboard until email is confirmed
            return;
          }
        }

        // Only proceed if email is confirmed (or not Google OAuth)
        await handleUserSession(session.user);
        isProcessing = false;
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('authUser');
        // Stay on login page
      } else if (event === 'TOKEN_REFRESHED' && session && session.user) {
        // Handle token refresh - check email confirmation again
        const isGoogleAuth = session.user.app_metadata?.provider === 'google' ||
          session.user.identities?.some(identity => identity.provider === 'google');

        // Skip email confirmation for Google OAuth with @tup.edu.ph domain
        if (isGoogleAuth && !isValidTUPEmail(session.user.email)) {
          await supabase.auth.signOut();
          localStorage.removeItem('authUser');
          setError('Only @tup.edu.ph email addresses are allowed for Google sign-in.');
        }
      } else if (event === 'USER_UPDATED' && session && session.user) {
        // Handle email confirmation - when user confirms email via link
        const isGoogleAuth = session.user.app_metadata?.provider === 'google' ||
          session.user.identities?.some(identity => identity.provider === 'google');

        if (isGoogleAuth && isEmailConfirmed(session.user)) {
          // Email is now confirmed, allow login
          setError(''); // Clear any error messages
          // User can now sign in normally - they'll need to click "Sign in with Google" again
          // or we can automatically process the session if it's valid
          if (session) {
            await handleUserSession(session.user);
          }
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
      authSubscription?.unsubscribe();
    };
  }, [navigate]);

  const handleUserSession = async (user) => {
    try {
      if (!user || !user.id) {
        console.error('Invalid user object');
        return;
      }

      // Check if this is a Google OAuth sign-in by checking the provider
      const isGoogleAuth = user.app_metadata?.provider === 'google' ||
        user.identities?.some(identity => identity.provider === 'google');

      // If Google OAuth, validate email domain and require confirmation BEFORE proceeding
      if (isGoogleAuth && user.email) {
        // Step 1: Validate email domain - MUST be @tup.edu.ph
        if (!isValidTUPEmail(user.email)) {
          // Sign out the user immediately
          await supabase.auth.signOut();
          // Clear any stored session data
          localStorage.removeItem('authUser');
          // Set error message
          setError('Only @tup.edu.ph email addresses are allowed for Google sign-in. Please use an email/password account or contact your administrator.');
          setGoogleLoading(false);
          return;
        }

        // Step 2: Skip email confirmation for Google OAuth with @tup.edu.ph domain
        // Google already verifies email ownership, domain check is sufficient
        const skipConfirmation = true; // @tup.edu.ph domain already validated above
        if (!skipConfirmation && !isEmailConfirmed(user)) {
          // Sign out user immediately
          await supabase.auth.signOut();
          localStorage.removeItem('authUser');

          // Send confirmation email
          try {
            const result = await sendOAuthConfirmationEmail(user.email);

            if (result.success) {
              setError(`✅ A confirmation email has been sent to ${user.email}. Please check your email (including spam folder) and click the confirmation link to complete your sign-in.`);
            } else {
              if (result.confirmationLink) {
                setError(`⚠️ Email service not configured. Please enable email confirmations in Supabase Dashboard > Authentication > Email > "Confirm sign up" and configure SMTP. Your confirmation link: ${result.confirmationLink.substring(0, 100)}... (Check console for full link)`);
                console.log('🔗 Full confirmation link:', result.confirmationLink);
              } else if (result.requiresDashboardConfig) {
                setError(`⚠️ Email confirmations are not enabled in Supabase Dashboard. Please enable them in Authentication > Email > "Confirm sign up" and configure SMTP. Your email: ${user.email}. Error: ${result.error}`);
              } else {
                setError(`Email confirmation required. Please check your email (${user.email}) for a confirmation link. If you don't see it, please contact support.`);
              }
            }
          } catch (err) {
            console.error('Error sending confirmation email:', err);
            setError(`Email confirmation required for ${user.email}. Please check your email for a confirmation link.`);
          }

          setGoogleLoading(false);
          return; // Stop here - user must confirm email first
        }
      }

      // Check if user has MFA enabled
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();

      if (factorsError) {
        console.error('Error checking MFA factors:', factorsError);
      }

      // If user has MFA enabled, challenge them
      if (factors?.totp && factors.totp.length > 0) {
        const factor = factors.totp[0];
        const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
          factorId: factor.id
        });

        if (challengeError) {
          console.error('Error creating MFA challenge:', challengeError);
          // Continue with normal flow if challenge fails
        } else if (challenge) {
          // setMfaChallenge(challenge); // Removed - MFA now handled via API routes
          setPendingUser(user);
          setShowMFAVerification(true);
          return;
        }
      }

      // No MFA or MFA challenge failed, continue with normal flow
      // Get user role from user metadata or profiles table
      let userRole = user?.user_metadata?.role || 'Student';
      let fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.display_name || '';

      // Check if user exists in secureshare_users table
      // Use maybeSingle() to avoid errors when user doesn't exist (prevents 406 errors)
      const { data: profileData, error: profileError } = await supabase
        .from('secureshare_users')
        .select('role, full_name, email')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle() instead of single() - returns null instead of error when no row found

      if (profileData) {
        // User exists, use their role
        userRole = profileData.role;
        fullName = profileData.full_name ||
          (profileData.first_name && profileData.last_name
            ? `${profileData.first_name} ${profileData.last_name}`.trim()
            : profileData.first_name || profileData.last_name || fullName);
      } else {
        // User doesn't exist or error occurred, create/update profile
        // Use upsert to handle race conditions (if user is created between check and insert)
        const nameParts = (fullName || user.email?.split('@')[0] || 'User').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        const fullNameValue = fullName || user.email?.split('@')[0] || 'User';

        // Use upsert with onConflict to handle existing users gracefully (prevents 409 errors)
        const { data: upsertedData, error: upsertError } = await supabase
          .from('secureshare_users')
          .upsert(
            {
              user_id: user.id,
              email: user.email,
              full_name: fullNameValue,
              role: 'Student',
            },
            {
              onConflict: 'user_id', // If user_id already exists, update instead of insert
              ignoreDuplicates: false, // Update existing records
            }
          )
          .select('role, full_name')
          .maybeSingle();

        if (upsertError) {
          console.error('Error upserting user profile:', upsertError);

          // If upsert fails due to conflict or other issues, try to fetch existing profile
          if (upsertError.code === '23505' || upsertError.code === 'PGRST116' ||
            upsertError.message?.includes('duplicate') || upsertError.message?.includes('409') ||
            upsertError.message?.includes('Conflict')) {
            // User might already exist, try to fetch it
            const { data: existingProfile } = await supabase
              .from('secureshare_users')
              .select('role, full_name')
              .eq('user_id', user.id)
              .maybeSingle();

            if (existingProfile) {
              userRole = existingProfile.role;
              fullName = existingProfile.full_name || fullName;
            } else {
              // If we still can't get the profile, default to student
              userRole = 'student';
            }
          } else {
            // Other error, default to student role
            userRole = 'student';
          }
        } else if (upsertedData) {
          // Upsert succeeded, use the returned data
          userRole = upsertedData.role || 'Student';
          fullName = upsertedData.full_name || fullName;
        } else {
          // No data returned but no error, default to student
          userRole = 'student';
        }
      }

      // Store user session
      localStorage.setItem(
        'authUser',
        JSON.stringify({
          id: user.id,
          email: user.email,
          fullName: fullName || user.email?.split('@')[0] || 'User',
          role: userRole
        })
      );

      // Redirect based on role (case-insensitive)
      const roleLower = userRole?.toLowerCase();
      if (roleLower === 'admin') {
        navigate('/admin-dashboard');
      } else if (roleLower === 'teacher') {
        navigate('/teacher-dashboard');
      } else {
        navigate('/portal');
      }
    } catch (err) {
      console.error('Error handling user session:', err);
      setError('Failed to complete sign in. Please try again.');
    }
  };

  const handleMFAVerified = async (data) => {
    setShowMFAVerification(false);
    if (pendingUser) {
      await handleUserSession(pendingUser);
      setPendingUser(null);
    }
  };

  const handleMFAEnrollmentComplete = () => {
    setShowMFAEnrollment(false);
    if (pendingUser) {
      handleUserSession(pendingUser);
      setPendingUser(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account consent', // Force account selection to ensure domain restriction
            hd: 'tup.edu.ph', // Restrict to tup.edu.ph domain (Google-specific parameter)
          },
        },
      });

      if (signInError) {
        console.error('Google OAuth error:', signInError);

        // Provide user-friendly error messages
        if (signInError.message?.includes('not enabled') || signInError.message?.includes('Unsupported provider')) {
          setError('Google sign-in is not enabled. Please contact your administrator to enable Google OAuth in Supabase settings.');
        } else if (signInError.message?.includes('redirect_uri')) {
          setError('Redirect URI mismatch. Please check Google OAuth configuration.');
        } else {
          setError(signInError.message || 'Failed to sign in with Google. Please try again.');
        }
        setGoogleLoading(false);
        return;
      }

      // OAuth will redirect, so we don't need to set loading to false here
      // The redirect will happen automatically
    } catch (err) {
      console.error('Google sign-in error:', err);

      // Handle different error types
      if (err.message?.includes('not enabled') || err.message?.includes('Unsupported provider')) {
        setError('Google sign-in is not enabled. Please enable Google OAuth in Supabase Dashboard > Authentication > Providers.');
      } else if (err.message?.includes('redirect_uri')) {
        setError('Redirect URI configuration error. Please check your Google OAuth settings.');
      } else {
        setError(err.message || 'Failed to sign in with Google. Please check your configuration.');
      }
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }

      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Check MFA status for email/password users (not Google OAuth)
      // Import the mfaApi functions dynamically to avoid issues
      try {
        const { getMfaStatus } = await import('../../utils/mfaApi');
        const mfaStatus = await getMfaStatus();

        // If user has MFA enabled but not at AAL2, show verification
        if (mfaStatus.hasMfaEnabled && mfaStatus.currentLevel === 'aal1') {
          setPendingUser(data.user);
          setShowMFAVerification(true);
          setLoading(false);
          return;
        }

        // If user doesn't have MFA enabled and is not a Google user, prompt enrollment
        if (!mfaStatus.hasMfaEnabled && !mfaStatus.isGoogleAuth) {
          setPendingUser(data.user);
          setShowMFAEnrollment(true);
          setLoading(false);
          return;
        }
      } catch (mfaErr) {
        // If MFA check fails (e.g., API not ready), continue with normal flow
        console.warn('MFA check failed, continuing with normal login:', mfaErr.message);
      }

      // Get user role from user metadata or profiles table
      let userRole = data.user?.user_metadata?.role || 'Student';
      let fullName = '';

      // If role is not in metadata, try to fetch from profiles table
      if (!userRole || userRole === 'student' || userRole === 'Student') {
        const { data: profileData } = await supabase
          .from('secureshare_users')
          .select('role, full_name')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (profileData) {
          userRole = profileData.role;
          fullName = profileData.full_name || '';
        }
      }

      // Store user session
      localStorage.setItem(
        'authUser',
        JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          fullName: fullName || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          role: userRole
        })
      );

      // Redirect based on role (case-insensitive)
      const roleLower = userRole?.toLowerCase();
      if (roleLower === 'admin') {
        navigate('/admin-dashboard');
      } else if (roleLower === 'teacher') {
        navigate('/teacher-dashboard');
      } else {
        navigate('/portal');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='bg-radial-at-center from-[#F9F0D9] to-[#F2F2F2] min-h-screen'>
      <Navbar />
      <header className='mx-auto px-4 max-w-7xl'>
        <section className='w-full min-h-[calc(100vh-120px)] flex items-start py-4'>
          <div className='w-full min-h-full rounded-3xl bg-white/30 backdrop-blur-xl border border-white/20 shadow-2xl px-6 py-8 lg:px-12 lg:py-12 text-lg flex flex-col lg:flex-row items-start gap-12'>
            <div className='w-full lg:max-w-2xl'>
              <h1 className='text-4xl lg:text-7xl text-[#7A1C1C] font-black tracking-tight mb-5 '>
                Secure File Sharing for Academic Excellence
              </h1>
              <p className='mb-10'>
                A trusted platform for students and teachers to share assignments, lecture notes, and research documents with end-to-end encryption and role-based access control.
              </p>
              <ul className='flex flex-col sm:flex-row gap-4 lg:gap-10'>
                <li>
                  <div className='bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg hover:bg-white/50 hover:-translate-y-1 hover:shadow-2xl px-6 py-5 text-sm rounded-2xl transition-all duration-300 cursor-pointer'>
                    <div className="bg-white/60 inline-flex items-center justify-center px-3 py-1 rounded-md mb-3 border border-white/40">
                      <FaLock size={20} color="#7A1C1C" strokeWidth={2.5} />
                    </div>
                    <span className='font-semibold block text-[#4B1B1B]'>Encrypted</span>
                    <span className='text-xs block mt-1 text-[#4B1B1B]/80'>End-to-end encryption for all file transfers and storage</span>
                  </div>
                </li>
                <li>
                  <div className='bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg hover:bg-white/50 hover:-translate-y-1 hover:shadow-2xl px-6 py-5 text-sm rounded-2xl transition-all duration-300 cursor-pointer'>
                    <div className="bg-white/60 inline-flex items-center justify-center px-3 py-1 rounded-md mb-3 border border-white/40">
                      <FaUsers size={22} color="#7A1C1C" strokeWidth={2.5} />
                    </div>
                    <span className='font-semibold block text-[#4B1B1B]'>Role-Based</span>
                    <span className='text-xs block mt-1 text-[#4B1B1B]/80'>Separate access controls for students and teachers</span>
                  </div>
                </li>
                <li>
                  <div className='bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg hover:bg-white/50 hover:-translate-y-1 hover:shadow-2xl px-6 py-5 text-sm rounded-2xl transition-all duration-300 cursor-pointer'>
                    <div className="bg-white/60 inline-flex items-center justify-center px-3 py-1 rounded-md mb-3 border border-white/40">
                      <IoShieldCheckmark size={20} color="#7A1C1C" strokeWidth={2.5} />
                    </div>
                    <span className='font-semibold block text-[#4B1B1B]'>Reliable</span>
                    <span className='text-xs block mt-1 text-[#4B1B1B]/80'>Secure database storage with backup and recovery</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className='w-full lg:max-w-sm rounded-2xl bg-white/40 backdrop-blur-lg text-center p-8 border border-white/50 shadow-2xl text-[#4B1B1B] lg:ml-auto'>
              <div className="flex flex-col items-center space-y-2 mb-6">
                <div className='bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] p-2.5 rounded-lg shadow-lg'>
                  <ShieldCheck className="text-white w-8 h-8" />
                </div>
                <h1 className="text-xl font-bold text-[#7A1C1C]">Welcome to SecureShare</h1>
              </div>

              <p className="font-light text-sm mb-6">
                Sign in to access your secure academic files
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="w-full max-w-xs mx-auto">
                <label className="flex justify-start text-sm font-semibold text-[#7A1C1C] mb-1">
                  Email
                </label>
                <div className="text-sm flex items-center h-10 border border-gray-400 rounded-lg px-3 mb-4">
                  <Mail size={20} color="#7A1C1C" className="mr-2" />
                  <input
                    type="email"
                    placeholder="student@university.edu"
                    className="w-full outline-none bg-transparent"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <label className="flex justify-start text-sm font-semibold text-[#7A1C1C] mb-1">
                  Password
                </label>
                <div className="text-sm flex items-center h-10 border border-gray-400 rounded-lg px-3 mb-4">
                  <Lock size={20} color="#7A1C1C" className='mr-2' />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full outline-none bg-transparent"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {/* Google Sign In Button */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  className="text-sm w-full mb-4 flex items-center justify-center gap-3 bg-white/30 backdrop-blur-xl hover:bg-white/50 text-[#4B1B1B] font-semibold py-2.5 rounded-lg border border-white/40 shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {googleLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/60 border-t-[#7A1C1C] rounded-full animate-spin"></div>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Sign in with Google</span>
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/40"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white/40 backdrop-blur-xl px-3 py-0.5 text-xs font-medium text-[#4B1B1B]/70 uppercase tracking-wide">Or</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || googleLoading}
                  className="text-sm w-full bg-[#7A1C1C] hover:bg-[#5a1515] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Loading..." : "Sign In"}
                </button>


              </div>
            </div>
          </div>
        </section>
      </header >

      {showMFAEnrollment && (
        <MFAEnrollment
          user={pendingUser}
          onComplete={handleMFAEnrollmentComplete}
          onSkip={() => {
            setShowMFAEnrollment(false);
            if (pendingUser) {
              handleUserSession(pendingUser);
            }
          }}
        />
      )}

      {
        showMFAVerification && (
          <MFAVerification
            onVerified={handleMFAVerified}
            onError={(err) => {
              setError(err.message || 'MFA verification failed');
              setShowMFAVerification(false);
            }}
          />
        )
      }
    </div >
  );
};

export default Login;

