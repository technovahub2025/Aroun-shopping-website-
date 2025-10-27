import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/newlogo.jpg';
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/product' },
    { name: 'Cart', path: '/cart' },
    { name: 'My Orders', path: '/orders' },
    { name: 'Profile', path: '/profile' }
  ];

  const socialLinks = [
    { icon: <Facebook size={20} />, url: 'https://facebook.com', name: 'Facebook' },
    { icon: <Instagram size={20} />, url: 'https://instagram.com', name: 'Instagram' },
    { icon: <Twitter size={20} />, url: 'https://twitter.com', name: 'Twitter' },
    { icon: <Linkedin size={20} />, url: 'https://linkedin.com', name: 'LinkedIn' }
  ];

  return (
    <footer className=" bg-white  shadow-inner">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <img src={logo} alt="Logo" className="h-12 w-auto object-contain" />
            
            </div>
            <p className="text-gray-600 text-sm">
              Your trusted neighborhood store for quality groceries and daily essentials.
              Fresh products at the best prices.
            </p>
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h3>
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 text-gray-600">
                <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                <span>Lawspet, Puducherry</span>
              </li>
              <li>
                <a
                  href="tel:+919876543210"
                  className="flex items-center space-x-3 text-gray-600 hover:text-green-600 transition-colors"
                >
                  <Phone className="w-5 h-5 text-green-600" />
                  <span>+91 98765 43210</span>
                </a>
              </li>
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
            <p className="text-gray-600 text-sm">
              © {year} Aroun stores. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-600">
              <a href="#" className="hover:text-green-600 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-green-600 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-green-600 transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;