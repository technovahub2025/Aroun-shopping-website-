
import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/newlogo.png';
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/product' },
    { name: 'Cart', path: '/cart' },
    { name: 'My Orders', path: '/orders' },
    { name: 'Profile', path: '/profile' }
  ];

  const policyLinks = [
    { name: 'Privacy Policy', path: '/privacy-policy' },
    { name: 'Terms of Service', path: '/terms-of-service' },
    { name: 'Cookie Policy', path: '/cookie-policy' }
  ];

  const socialLinks = [
    {
      icon: <Facebook size={20} />,
      url: 'https://www.facebook.com/',
      name: 'Facebook'
    },
    {
      icon: <Instagram size={20} />,
      url: 'https://www.instagram.com/',
      name: 'Instagram'
    },
    
  ];

  return (
    <footer className="bg-green-100 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* Main Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <img
                src={logo}
                alt="Aroun Stores Logo"
                className="h-20 w-auto object-contain"
              />
            </div>

            <p className="text-gray-600 text-sm">
              Your trusted neighborhood store for quality groceries and
              daily essentials. Fresh products at the best prices.
            </p>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center text-green-600 transition-colors"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Links
            </h3>

            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Contact Us
            </h3>

            <ul className="space-y-4">

              {/* Address */}
              <li className="flex items-start space-x-3 text-gray-600">
                <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                <span>Lawspet, Puducherry</span>
              </li>

              {/* Phone */}
              <li>
                <a
                  href="tel:+919629600230"
                  className="flex items-center space-x-3 text-gray-600 hover:text-green-600 transition-colors"
                >
                  <Phone className="w-5 h-5 text-green-600" />
                  <span>
                    +91 9629600230 / +91 9003530230
                  </span>
                </a>
              </li>

              {/* Email */}
              <li>
                <a
                  href="mailto:contact@arounstores.com"
                  className="flex items-center space-x-3 text-gray-600 hover:text-green-600 transition-colors"
                >
                  <Mail className="w-5 h-5 text-green-600" />
                  <span>contact@arounstores.com</span>
                </a>
              </li>

            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-green-200">

          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">

            {/* Copyright */}
            <p className="text-gray-600 text-sm">
              © {year} Aroun Stores. All rights reserved.
            </p>

            {/* Policy Links */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
              {policyLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="hover:text-green-600 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>

          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
