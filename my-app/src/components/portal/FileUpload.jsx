import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, fileObj.file, { 
          upsert: true, 
          contentType: fileObj.file.type || 'application/octet-stream' 
        });

      clearInterval(progressInterval);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setFiles((prevFiles) => {
          const updatedFiles = [...prevFiles];
          if (updatedFiles[fileIndex]) {
            updatedFiles[fileIndex].status = 'error';
            updatedFiles[fileIndex].error = uploadError.message;
          }
          return updatedFiles;
        });
        return;
      }

      // Get public URL
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);

      // Save file metadata to database
      const { data: fileData, error: dbError } = await supabase.from('files').insert({
        user_id: userId,
        file_name: fileObj.name,
        file_path: path,
        file_size: Math.round(parseFloat(fileObj.size) * 1024 * 1024),
        file_type: fileObj.file.type || 'application/octet-stream',
        folder_path: folderPath || '',
        bucket: bucket,
        is_folder: false,
        is_trashed: false
      }).select().single();

      if (dbError) {
        console.error('Error saving file metadata:', dbError);
      }

      // Log activity
      await supabase.from('activity_log').insert({
        user_id: userId,
        action_type: 'upload',
        file_name: fileObj.name,
        file_id: fileData?.file_id || null,
        details: { 
          size: fileObj.size, 
          type: fileObj.file.type,
          folder: folderPath || 'root'
        }
      });

      setFiles((prevFiles) => {
        const updatedFiles = [...prevFiles];
        if (updatedFiles[fileIndex]) {
          updatedFiles[fileIndex].progress = 100;
          updatedFiles[fileIndex].status = 'complete';
          updatedFiles[fileIndex].path = path;
          updatedFiles[fileIndex].url = publicData?.publicUrl || '';
          updatedFiles[fileIndex].bucket = bucket;
          updatedFiles[fileIndex].fileId = fileData?.file_id;
        }
        return updatedFiles;
      });
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
    window.dispatchEvent(new Event('app:files:updated'));
    onClose();
  };

  const completedCount = files.filter(f => f.status === 'complete').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-[#ACA8AE]">
          <h2 className="text-2xl font-bold text-[#585658]">Upload Files</h2>
          <button
            onClick={onClose}
            className="text-[#585658] hover:text-[#7A1C1C] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Drag and Drop Area */}
        <div className="p-6">
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-4 border-dashed rounded-lg p-12 text-center transition-all ${
              isDragging
                ? 'border-[#7A1C1C] bg-[#F9F0D9]'
                : 'border-[#ACA8AE] bg-gray-50'
            }`}
          >
            <Upload
              size={48}
              className={`mx-auto mb-4 ${
                isDragging ? 'text-[#7A1C1C]' : 'text-[#ACA8AE]'
              }`}
            />
            <p className="text-lg font-semibold text-[#585658] mb-2">
              Drag and drop files here
            </p>
            <p className="text-sm text-[#A6A4AA] mb-4">
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
              className="inline-block px-6 py-3 bg-[#7A1C1C] text-white rounded-md cursor-pointer hover:bg-[#5a1515] transition-colors"
            >
              Browse Files
            </label>
            <p className="text-xs text-[#A6A4AA] mt-4">
              All file types supported (Max 50MB per file)
            </p>
          </div>

          {/* File List with Progress Bars */}
          {files.length > 0 && (
            <div className="mt-6 max-h-64 overflow-y-auto">
              <h3 className="text-lg font-semibold text-[#585658] mb-3">
                {completedCount === files.length 
                  ? `✓ ${completedCount} file(s) uploaded successfully`
                  : `Uploading ${files.length} file(s)...`
                }
              </h3>
              {files.map((fileObj, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-[#ACA8AE] rounded-md p-4 mb-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center flex-1">
                      {fileObj.status === 'complete' ? (
                        <CheckCircle size={20} className="text-green-600 mr-2" />
                      ) : fileObj.status === 'error' ? (
                        <AlertCircle size={20} className="text-red-600 mr-2" />
                      ) : (
                        <FileText size={20} className="text-[#7A1C1C] mr-2" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-[#585658] text-sm">
                          {fileObj.name}
                        </p>
                        <p className="text-xs text-[#A6A4AA]">
                          {fileObj.size} MB
                          {fileObj.error && (
                            <span className="text-red-500 ml-2">• {fileObj.error}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-[#A6A4AA] hover:text-[#7A1C1C] transition-colors ml-2"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        fileObj.status === 'complete'
                          ? 'bg-green-600'
                          : fileObj.status === 'error'
                          ? 'bg-red-600'
                          : 'bg-[#7A1C1C]'
                      }`}
                      style={{ width: `${fileObj.progress}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-xs text-[#A6A4AA] mt-1 text-right">
                    {fileObj.status === 'complete'
                      ? 'Complete'
                      : fileObj.status === 'error'
                      ? 'Failed'
                      : `${fileObj.progress}%`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t-2 border-[#ACA8AE] bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border-2 border-[#ACA8AE] text-[#585658] rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            className="px-6 py-2 bg-[#7A1C1C] text-white rounded-md hover:bg-[#5a1515] transition-colors"
          >
            {completedCount > 0 ? `Done (${completedCount} uploaded)` : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
