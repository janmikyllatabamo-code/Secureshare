import React from "react";
import { Link } from "react-router-dom";
import { FaLock,  FaShieldAlt, FaUsers } from "react-icons/fa";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-[#7A1C1C]">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <div className='flex items-center justify-center bg-yellow-100 rounded-full w-8 h-8 mb-2'>
        <FaShieldAlt size={20} color="#7A1C1C" strokeWidth={2.5}/>
      </div>
        <div className="text-white text-xl font-extrabold">SecureShare</div>
      </Link>
      
      <ul className="flex gap-8">
        <li><a href="#" className="text-white hover:text-yellow-200">Features</a></li>
        <li><a href="#" className="text-white hover:text-yellow-200">Security</a></li>
        <li><Link to="/about" className="text-white hover:text-yellow-200">About</Link></li>
      </ul>
    </nav>
  );
}



