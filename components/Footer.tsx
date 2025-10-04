"use client";

import Image from "next/image";
import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter signup
    console.log("Newsletter signup:", email);
    setEmail("");
  };

  return (
    <footer className="bg-slate-100 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Newsletter Section */}
          <div className="lg:col-span-1">
            <Image
              src="/raa-logo.svg"
              alt="RAAus Logo"
              width={200}
              height={40}
              priority
              className="h-auto mb-6"
            />
            <p className="text-gray-700 mb-4 text-sm">
              Sign up to our newsletter for the latest from RAAus
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors font-medium w-fit"
              >
                SUBMIT
              </button>
            </form>
          </div>

          {/* Fly With Us */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Fly With Us</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  Learn To Fly
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  Become a Member
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  Trial Instructional Flight
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  Find a School
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  Find a Flight Club
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  Converting Pilots
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  RAAus Scholarships
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  GoFly Online
                </a>
              </li>
            </ul>
          </div>

          {/* Registration Search */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Registration Search</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  News
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  Events
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  Resources
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  Safety
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  Report an Accident, Incident, Defect, Hazard or Complaint
                </a>
              </li>
            </ul>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  SportPilot
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  Classifieds
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  Member Login
                </a>
              </li>
              <li>
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  Finance
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-black text-white py-4">
        <div className="container mx-auto px-4">
          <p className="text-sm">Copyright {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}
