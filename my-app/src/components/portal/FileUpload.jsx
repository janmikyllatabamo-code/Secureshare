// ============= NEW FILE: File Upload Component with Drag & Drop =============
import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';

export const FileUpload = ({ onClose }) => {
  // State to track uploaded files and their progress
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Handle file selection (both click and drag-and-drop)
  const handleFiles = useCallback((selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const newFiles = fileArray.map((file) => ({
      file,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2), // Convert to MB
      progress: 0,
      status: 'uploading', // uploading, complete, error
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload progress for each file
    newFiles.forEach((fileObj, index) => {
      simulateUpload(files.length + index);
    });
  }, [files.length]);

  // Simulate file upload with progress bar
  const simulateUpload = (fileIndex) => {
    const interval = setInterval(() => {
      setFiles((prevFiles) => {
        const updatedFiles = [...prevFiles];
        if (updatedFiles[fileIndex].progress < 100) {
          updatedFiles[fileIndex].progress += 10;
        } else {
          updatedFiles[fileIndex].status = 'complete';
          clearInterval(interval);
        }
        return updatedFiles;
      });
    }, 200);
  };

  // Handle drag events
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
    
    // Handle dropped files
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
  };

  // Remove a file from the list
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Modal Container */}
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
              accept=".docx,.pdf,.pptx,.jpg,.png"
            />
            <label
              htmlFor="fileInput"
              className="inline-block px-6 py-3 bg-[#7A1C1C] text-white rounded-md cursor-pointer hover:bg-[#5a1515] transition-colors"
            >
              Browse Files
            </label>
            <p className="text-xs text-[#A6A4AA] mt-4">
              Supported: .DOCX, .PDF, .PPTX, .JPG, .PNG
            </p>
          </div>

          {/* File List with Progress Bars */}
          {files.length > 0 && (
            <div className="mt-6 max-h-64 overflow-y-auto">
              <h3 className="text-lg font-semibold text-[#585658] mb-3">
                Uploading Files
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
                      ) : (
                        <FileText size={20} className="text-[#7A1C1C] mr-2" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-[#585658] text-sm">
                          {fileObj.name}
                        </p>
                        <p className="text-xs text-[#A6A4AA]">
                          {fileObj.size} MB
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
                          : 'bg-[#7A1C1C]'
                      }`}
                      style={{ width: `${fileObj.progress}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-xs text-[#A6A4AA] mt-1 text-right">
                    {fileObj.status === 'complete'
                      ? 'Complete'
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
            onClick={onClose}
            className="px-6 py-2 bg-[#7A1C1C] text-white rounded-md hover:bg-[#5a1515] transition-colors"
            disabled={files.length === 0}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

