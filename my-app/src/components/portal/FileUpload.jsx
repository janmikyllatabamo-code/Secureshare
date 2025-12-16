import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import * as tus from 'tus-js-client';

export const FileUpload = ({ onClose, folderPath = '' }) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const newFiles = fileArray.map((file) => ({
      file,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2),
      progress: 0,
      status: 'uploading',
    }));

    setFiles((prev) => {
      const startIndex = prev.length;
      const next = [...prev, ...newFiles];
      newFiles.forEach((fileObj, index) => {
        const absoluteIndex = startIndex + index;
        uploadFileToSupabase(fileObj, absoluteIndex);
      });
      return next;
    });
  };

  // Resumable upload function for large files using TUS protocol
  const uploadFileResumable = async (file, path, bucket, fileIndex, progressInterval) => {
    return new Promise((resolve, reject) => {
      // Get session for authentication
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          reject(new Error('Not authenticated'));
          return;
        }

        // Extract project ID from Supabase URL
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vlxkhqvsvfjjhathgakp.supabase.co';
        const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'vlxkhqvsvfjjhathgakp';
        const storageEndpoint = `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`;

        const upload = new tus.Upload(file, {
          endpoint: storageEndpoint,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            authorization: `Bearer ${session.access_token}`,
            'x-upsert': 'true',
            apikey: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: bucket,
            objectName: path,
            contentType: file.type || 'application/octet-stream',
            cacheControl: '3600',
          },
          chunkSize: 6 * 1024 * 1024, // 6MB chunks as recommended by Supabase
          onError: (error) => {
            console.error('Resumable upload failed:', error);
            if (progressInterval) clearInterval(progressInterval);
            reject(error);
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const percentage = Math.floor((bytesUploaded / bytesTotal) * 90); // Up to 90% for upload
            setFiles((prevFiles) => {
              const updatedFiles = [...prevFiles];
              if (updatedFiles[fileIndex]) {
                updatedFiles[fileIndex].progress = percentage;
              }
              return updatedFiles;
            });
          },
          onSuccess: () => {
            console.log('Resumable upload successful:', upload.url);
            if (progressInterval) clearInterval(progressInterval);
            // Set progress to 100% after successful upload
            setFiles((prevFiles) => {
              const updatedFiles = [...prevFiles];
              if (updatedFiles[fileIndex]) {
                updatedFiles[fileIndex].progress = 100;
              }
              return updatedFiles;
            });
            resolve(null); // Success
          },
        });

        // Check for previous uploads and resume if available
        upload.findPreviousUploads().then((previousUploads) => {
          if (previousUploads.length) {
            upload.resumeFromPreviousUpload(previousUploads[0]);
          }
          upload.start();
        });
      }).catch((err) => {
        if (progressInterval) clearInterval(progressInterval);
        reject(err);
      });
    });
  };

  const uploadFileToSupabase = async (fileObj, fileIndex) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFiles((prevFiles) => {
          const updatedFiles = [...prevFiles];
          if (updatedFiles[fileIndex]) {
            updatedFiles[fileIndex].status = 'error';
            updatedFiles[fileIndex].error = 'Not authenticated';
          }
          return updatedFiles;
        });
        return;
      }

      const userId = user.id;
      const safeName = fileObj.name.replace(/[^\w\-.]+/g, '_');
      const timestamp = Date.now();
      const prefix = folderPath ? `${folderPath}/` : '';
      const path = `${userId}/${prefix}${timestamp}_${safeName}`;
      const bucket = 'files';

      // Simulate progress
      const progressInterval = setInterval(() => {
        setFiles((prevFiles) => {
          const updatedFiles = [...prevFiles];
          if (!updatedFiles[fileIndex] || updatedFiles[fileIndex].status !== 'uploading') {
            clearInterval(progressInterval);
            return prevFiles;
          }
          if (updatedFiles[fileIndex].progress < 90) {
            updatedFiles[fileIndex].progress += 15;
          }
          return updatedFiles;
        });
      }, 150);

      // Upload to Supabase Storage with resumable upload for large files
      const fileSize = fileObj.file.size;
      const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50MB threshold
      let uploadError = null;

      if (fileSize > LARGE_FILE_THRESHOLD) {
        // Clear the simulated progress interval for resumable uploads (TUS handles progress)
        clearInterval(progressInterval);
        // Use resumable upload (TUS protocol) for files larger than 50MB
        try {
          await uploadFileResumable(
            fileObj.file,
            path,
            bucket,
            fileIndex,
            null // No progress interval needed for TUS
          );
          uploadError = null; // Success
        } catch (err) {
          uploadError = err;
        }
      } else {
        // Regular upload for smaller files
        const { error } = await supabase.storage
          .from(bucket)
          .upload(path, fileObj.file, { 
            upsert: true, 
            contentType: fileObj.file.type || 'application/octet-stream' 
          });
        uploadError = error;
        clearInterval(progressInterval);
      }

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setFiles((prevFiles) => {
          const updatedFiles = [...prevFiles];
          if (updatedFiles[fileIndex]) {
            updatedFiles[fileIndex].status = 'error';
            // Provide more helpful error message
            if (uploadError.message?.includes('maximum allowed size')) {
              updatedFiles[fileIndex].error = 'File too large. Please contact administrator to increase storage limit or compress the file.';
            } else {
              updatedFiles[fileIndex].error = uploadError.message;
            }
          }
          return updatedFiles;
        });
        return;
      }

      // Get public URL
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);

      // Save file metadata to database - CRITICAL: Must succeed for upload to be considered complete
      // Try using the insert_file function first (bypasses RLS), then fallback to direct insert
      // fileObj.file.size is already in bytes, no conversion needed
      const fileSizeBytes = fileObj.file.size;
      let insertedFile = null;
      let dbError = null;
      
      // First, try using the RPC function (bypasses RLS)
      console.log('Attempting to insert file via RPC function, user_id:', userId);
      const { data: fileRecord, error: rpcError } = await supabase.rpc('insert_file', {
        p_user_id: userId,
        p_file_name: fileObj.name,
        p_file_path: path,
        p_file_size: fileSizeBytes,
        p_file_type: fileObj.file.type || 'application/octet-stream',
        p_folder_path: folderPath || '',
        p_bucket: bucket,
        p_is_folder: false,
        p_is_trashed: false,
        p_is_shared: false
      });

      console.log('RPC function result:', { fileRecord, rpcError, type: Array.isArray(fileRecord) ? 'array' : typeof fileRecord });

      if (!rpcError && fileRecord) {
        // Function returns a TABLE (array), so get the first element
        if (Array.isArray(fileRecord) && fileRecord.length > 0) {
          insertedFile = fileRecord[0];
          console.log('File inserted successfully (from array):', insertedFile);
        } else if (fileRecord && fileRecord.file_id) {
          // If it's already an object (shouldn't happen but handle it)
          insertedFile = fileRecord;
          console.log('File inserted successfully (as object):', insertedFile);
        } else {
          console.error('RPC function returned unexpected format:', fileRecord);
          dbError = { message: 'Unexpected return format from insert_file function' };
        }
      } else {
        // Function failed - log the error
        console.error('RPC function failed:', rpcError);
        dbError = rpcError;
        
        // If RPC fails, try direct insert as fallback
        if (rpcError) {
          console.log('Attempting direct insert as fallback...');
          const { data: directInsert, error: insertError } = await supabase
            .from('files')
            .insert({
              user_id: userId,
              file_name: fileObj.name,
              file_path: path,
              file_size: fileSizeBytes,
              file_type: fileObj.file.type || 'application/octet-stream',
              folder_path: folderPath || '',
              bucket: bucket,
              is_folder: false,
              is_trashed: false,
              is_shared: false
            })
            .select()
            .single();
          
          if (!insertError && directInsert) {
            insertedFile = directInsert;
            console.log('Direct insert succeeded:', insertedFile);
            dbError = null; // Clear error since fallback worked
          } else {
            console.error('Direct insert also failed:', insertError);
            dbError = insertError || rpcError; // Use the most recent error
          }
        }
      }

      // If database save fails, mark as error and return early
      if (dbError || !insertedFile) {
        console.error('Error saving file metadata to database:', dbError);
        setFiles((prevFiles) => {
          const updatedFiles = [...prevFiles];
          if (updatedFiles[fileIndex]) {
            updatedFiles[fileIndex].status = 'error';
            updatedFiles[fileIndex].error = dbError 
              ? `Database error: ${dbError.message || 'Failed to save file record'}` 
              : 'File uploaded but database record not found';
            updatedFiles[fileIndex].progress = 0;
          }
          return updatedFiles;
        });
        
        // Try to delete the uploaded file from storage since database save failed
        try {
          await supabase.storage.from(bucket).remove([path]);
        } catch (deleteError) {
          console.error('Failed to clean up storage file:', deleteError);
        }
        return;
      }

      // Verify insertedFile has file_id
      if (!insertedFile.file_id) {
        console.error('Database insert succeeded but no file_id in record');
        setFiles((prevFiles) => {
          const updatedFiles = [...prevFiles];
          if (updatedFiles[fileIndex]) {
            updatedFiles[fileIndex].status = 'error';
            updatedFiles[fileIndex].error = 'File uploaded but database record incomplete';
            updatedFiles[fileIndex].progress = 0;
          }
          return updatedFiles;
        });
        return;
      }

      // Log activity to activity_log (non-critical, don't fail upload if this fails)
      try {
        await supabase.from('activity_log').insert({
          user_id: userId,
          action_type: 'upload',
          file_name: fileObj.name,
          file_id: insertedFile.file_id,
          details: { 
            size: fileObj.size, 
            type: fileObj.file.type,
            folder: folderPath || 'root'
          }
        });
      } catch (activityError) {
        // Log activity error but don't fail the upload
        console.warn('Failed to log activity (non-critical):', activityError);
      }

      // Only mark as complete if database save was successful
      setFiles((prevFiles) => {
        const updatedFiles = [...prevFiles];
        if (updatedFiles[fileIndex]) {
          updatedFiles[fileIndex].progress = 100;
          updatedFiles[fileIndex].status = 'complete';
          updatedFiles[fileIndex].path = path;
          updatedFiles[fileIndex].url = publicData?.publicUrl || '';
          updatedFiles[fileIndex].bucket = bucket;
          updatedFiles[fileIndex].fileId = insertedFile.file_id; // Use file_id from successful database insert
        }
        return updatedFiles;
      });

      // Dispatch event to refresh dashboard after successful upload
      window.dispatchEvent(new Event('app:files:updated'));
    } catch (err) {
      console.error('Upload error:', err);
      setFiles((prevFiles) => {
        const updatedFiles = [...prevFiles];
        if (updatedFiles[fileIndex]) {
          updatedFiles[fileIndex].status = 'error';
          updatedFiles[fileIndex].error = err.message;
        }
        return updatedFiles;
      });
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDone = () => {
    // Dispatch event to refresh file lists in all components
    window.dispatchEvent(new Event('app:files:updated'));
    onClose();
  };

  const completedCount = files.filter(f => f.status === 'complete').length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#ACA8AE] flex-shrink-0">
          <h2 className="text-xl font-bold text-[#585658]">Upload Files</h2>
          <button
            onClick={onClose}
            className="text-[#585658] hover:text-[#7A1C1C] transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            {/* Drag and Drop Area */}
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-4 border-dashed rounded-lg p-8 sm:p-10 text-center transition-all ${
                isDragging
                  ? 'border-[#7A1C1C] bg-[#F9F0D9]'
                  : 'border-[#ACA8AE] bg-gray-50'
              }`}
            >
              <Upload
                size={40}
                className={`mx-auto mb-3 ${
                  isDragging ? 'text-[#7A1C1C]' : 'text-[#ACA8AE]'
                }`}
              />
              <p className="text-base font-semibold text-[#585658] mb-1">
                Drag and drop files here
              </p>
              <p className="text-sm text-[#A6A4AA] mb-3">
                or click to browse
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
                id="fileInput"
              />
              <label
                htmlFor="fileInput"
                className="inline-block px-5 py-2.5 bg-[#7A1C1C] text-white text-sm font-semibold rounded-md cursor-pointer hover:bg-[#5a1515] transition-colors"
              >
                Browse Files
              </label>
              <p className="text-xs text-[#A6A4AA] mt-3">
                All file types supported (Large files supported)
              </p>
            </div>

            {/* File List with Progress Bars */}
            {files.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  {completedCount === files.length ? (
                    <CheckCircle size={18} className="text-green-600" />
                  ) : null}
                  <h3 className="text-base font-semibold text-[#585658]">
                    {completedCount === files.length 
                      ? `${completedCount} file(s) uploaded successfully`
                      : `Uploading ${files.length} file(s)...`
                    }
                  </h3>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {files.map((fileObj, index) => (
                    <div
                      key={index}
                      className="bg-white border-2 border-[#ACA8AE] rounded-md p-3"
                    >
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <div className="flex items-start flex-1 min-w-0">
                          {fileObj.status === 'complete' ? (
                            <CheckCircle size={18} className="text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                          ) : fileObj.status === 'error' ? (
                            <AlertCircle size={18} className="text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                          ) : (
                            <FileText size={18} className="text-[#7A1C1C] mr-2 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#585658] text-sm truncate" title={fileObj.name}>
                              {fileObj.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-[#A6A4AA]">
                                {fileObj.size} MB
                              </p>
                              {fileObj.status === 'complete' && (
                                <span className="text-xs text-green-600 font-medium">Complete</span>
                              )}
                              {fileObj.status === 'error' && (
                                <span className="text-xs text-red-500">• {fileObj.error}</span>
                              )}
                              {fileObj.status === 'uploading' && (
                                <span className="text-xs text-[#7A1C1C]">{fileObj.progress}%</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-[#A6A4AA] hover:text-[#7A1C1C] transition-colors ml-2 flex-shrink-0 p-1"
                          title="Remove file"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            fileObj.status === 'complete'
                              ? 'bg-green-600'
                              : fileObj.status === 'error'
                              ? 'bg-red-600'
                              : 'bg-[#7A1C1C]'
                          }`}
                          style={{ width: `${fileObj.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t-2 border-[#ACA8AE] bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 border-2 border-[#ACA8AE] text-[#585658] text-sm font-semibold rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            className="px-5 py-2 bg-[#7A1C1C] text-white text-sm font-semibold rounded-md hover:bg-[#5a1515] transition-colors"
          >
            {completedCount > 0 ? `Done (${completedCount} uploaded)` : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
