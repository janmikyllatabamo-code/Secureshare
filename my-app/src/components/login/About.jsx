import React from 'react'
import { FaFacebook, FaLinkedin, FaInstagram } from 'react-icons/fa'
import { FaXTwitter } from "react-icons/fa6";
import toniPic from '../../assets/toni_pic.JPG'
import mikaPic from '../../assets/mika_pic.JPG'
import andrianPic from '../../assets/andrian_pic.JPG'

export const About = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-start justify-center px-4 pt-16 md:pt-24 pb-16">
        <div className="text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-black text-[#7A1C1C] mb-6 mt-20 leading-tight text-pretty">
            Our mission is to make academic collaboration<br />safer, simpler, and<br />more organized.
          </h1>
          <p className="text-base md:text-xl text-[#7A1C1C] opacity-80 pb-20">
            A secure platform for students and teachers to share and manage files with confidence.
          </p>
        </div>
      </div>

      {/* Our Team Section */}
      <div className="bg-[#B84545] py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-12">
            Our Team
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Toni Ahn Narra */}
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <img 
                  src={toniPic} 
                  alt="Toni Ahn Narra" 
                  style={{ width: '407px', height: '611px' }}
                  className="object-cover rounded-lg border border-black"
                />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                Toni Ahn Narra
              </h3>
              <p className="text-sm text-white mb-4">
                Developed the Front End & Back End
              </p>
              <div className="flex justify-center gap-4">
                <FaFacebook className="text-white text-xl cursor-pointer hover:text-gray-300" />
                <FaLinkedin className="text-white text-xl cursor-pointer hover:text-gray-300" />
                <FaXTwitter className="text-white text-xl cursor-pointer hover:text-gray-300" />
                <FaInstagram className="text-white text-xl cursor-pointer hover:text-gray-300" />
              </div>
            </div>

            {/* Jan Mikylla Tabamo */}
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <img 
                  src={mikaPic} 
                  alt="Jan Mikylla Tabamo" 
                  style={{ width: '407px', height: '611px' }}
                  className="object-cover rounded-lg border border-black"
                />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                Jan Mikylla Tabamo
              </h3>
              <p className="text-sm text-white mb-4">
                Developed the Front End & Back End
              </p>
              <div className="flex justify-center gap-4">
                <FaFacebook className="text-white text-xl cursor-pointer hover:text-gray-300" />
                <FaLinkedin className="text-white text-xl cursor-pointer hover:text-gray-300" />
                <FaXTwitter className="text-white text-xl cursor-pointer hover:text-gray-300" />
                <FaInstagram className="text-white text-xl cursor-pointer hover:text-gray-300" />
              </div>
            </div>

            {/* Andrian Veliganio */}
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <img 
                  src={andrianPic} 
                  alt="Andrian Veliganio" 
                  style={{ width: '407px', height: '611px' }}
                  className="object-cover rounded-lg border border-black"
                />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                Andrian Veliganio
              </h3>
              <p className="text-sm text-white mb-4">
                Developed the Front End & Back End
              </p>
              <div className="flex justify-center gap-4">
                <FaFacebook className="text-white text-xl cursor-pointer hover:text-gray-300" />
                <FaLinkedin className="text-white text-xl cursor-pointer hover:text-gray-300" />
                <FaXTwitter className="text-white text-xl cursor-pointer hover:text-gray-300" />
                <FaInstagram className="text-white text-xl cursor-pointer hover:text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


