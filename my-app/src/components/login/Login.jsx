import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, CircleUserRound } from 'lucide-react';
import { FaLock,  FaShieldAlt, FaUsers } from "react-icons/fa";
import { IoShieldCheckmark } from "react-icons/io5";
import Navbar from './Navbar';

const Login = () => {
  const [action, setAction] = useState("Sign In");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    // Demo-only auth: accept any non-empty email/password
    if (action === "Sign In") {
      if (!email || !password) return;
      localStorage.setItem(
        'authUser',
        JSON.stringify({ email })
      );
      navigate('/portal');
      return;
    }

    // Register flow (demo): require minimal fields
    if (!fullName || !email || !password || !role) return;
    localStorage.setItem(
      'authUser',
      JSON.stringify({ fullName, email, role })
    );
    navigate('/portal');
  };

  return (
    <div className='bg-[#F2F2F2] min-h-screen'>
      <Navbar />
      <header className='container mx-auto'>
        <section className='h-screen grid grid-cols-1 lg:grid-cols-2 justify-items-center items-center text-lg px-8 gap-8'>
          <div className='max-w-2xl'>
            <h1 className='text-4xl lg:text-6xl text-[#7A1C1C] font-black tracking-tight mb-10'>
              Secure File Sharing for Academic Excellence
            </h1>
            <p className='mb-8'>
              A trusted platform for students and teachers to share assignments, lecture notes, and research documents with end-to-end encryption and role-based access control.
            </p>
            <ul className='flex flex-col sm:flex-row gap-4 lg:gap-10'>
              <li>
                <div className='bg-white hover:bg-[#F9F0D9] px-6 py-5 text-sm rounded-lg border-solid border-2 border-black transition-colors cursor-default'>
                   <div className="bg-[#EAC9C9] inline-flex items-center justify-center px-3 py-1 rounded-md mb-2 border ">
                    <FaLock size={20} color="#7A1C1C" strokeWidth={2.5} />
                  </div>
                  <span className='font-semibold block'>Encrypted</span>
                  <span className='text-xs block mt-1'>End-to-end encryption for all file transfers and storage</span>
                </div>
              </li>
              <li>
                <div className='bg-white hover:bg-[#F9F0D9] px-6 py-5 text-sm rounded-lg border-solid border-2 border-black transition-colors cursor-default'>
                  <div className="bg-[#EAC9C9] inline-flex items-center justify-center px-3 py-1 rounded-md mb-2 border ">
                    <FaUsers size={22} color="#7A1C1C" strokeWidth={2.5} />
                  </div>
                  <span className='font-semibold block'>Role-Based</span>
                  <span className='text-xs block mt-1'>Separate access controls for students and teachers</span>
                </div>
              </li>
              <li>
                <div className='bg-white hover:bg-[#F9F0D9] px-6 py-5 text-sm rounded-lg border-solid border-2 border-black transition-colors cursor-default'>
                  <div className="bg-[#EAC9C9] inline-flex items-center justify-center px-3 py-1 rounded-md mb-2 border">
                    <IoShieldCheckmark size={20} color="#7A1C1C" strokeWidth={2.5} /> 
                  </div>
                  <span className='font-semibold block'>Reliable</span>
                  <span className='text-xs block mt-1'>Secure database storage with backup and recovery</span>
                </div>
              </li>
            </ul>
          </div>

          <div className={`w-full max-w-[450px] rounded-lg bg-white text-center p-8 border-2 border-gray-200 ${action === "Register" ? "h-auto lg:h-[600px]" : "h-auto lg:h-[520px]"}`}>
              <div className="flex flex-col items-center space-y-2 mb-6">
                <div className="flex items-center justify-center bg-yellow-100 rounded-full w-16 h-16">
                  <FaShieldAlt size={30} color="#7A1C1C" strokeWidth={2.5} />
                </div>
                <h1 className="text-xl font-bold text-[#7A1C1C]">Welcome to SecureShare</h1>
              </div>

            <p className="font-light text-sm mb-6">
              {action === "Sign In"
                ? "Sign in to access your secure academic files"
                : "Create an account to start sharing files securely"}
            </p>

            <div className='flex mb-6 bg-black rounded-lg p-1'>
              <button
                onClick={() => setAction("Sign In")}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
                  action === "Sign In" ? "bg-[#7A1C1C] text-white" : "text-white"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAction("Register")}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
                  action === "Register" ? "bg-[#7A1C1C] text-white" : "text-white"
                }`}
              >
                Register
              </button>
            </div>

            <div className="w-full max-w-xs mx-auto">
                {action === "Register" && (
                    <>
                    <label className="flex justify-start text-sm font-semibold text-[#7A1C1C] mb-1">
                        Full Name
                    </label>
                    <div className="text-sm flex items-center h-10 border border-gray-400 rounded-lg px-3 mb-4">
                      <CircleUserRound size={20} color="#7A1C1C" className='mr-2' />
                    <input
                        type="text"
                        placeholder="John Doe"
                        className="w-full outline-none bg-transparent"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>
                    </>
                )}

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
                <div className="text-sm flex items-center h-10 border border-gray-400 rounded-lg px-3 mb-6">
                  <Lock size={20} color="#7A1C1C" className='mr-2'/>
                    <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full outline-none bg-transparent"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                  <button onClick={handleSubmit} className="text-sm w-full bg-[#7A1C1C] hover:bg-[#5a1515] text-white font-semibold py-2.5 rounded-lg transition-colors">
                    {action === "Sign In" ? "Sign In" : "Create Account"}
                  </button>
                

            </div>
          </div>
        </section>
      </header>
    </div>
  );
};

export default Login;

