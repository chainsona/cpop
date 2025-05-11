'use client';

import { usePageTitle } from '@/contexts/page-title-context';
import { useEffect } from 'react';

export default function PrivacyPolicy() {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('Privacy Policy');
  }, [setPageTitle]);

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
      <p className="mb-4">
        POAP Platform ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
        use, disclose, and safeguard your information when you visit our website and use our services.
      </p>
      <p className="mb-4">
        Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not 
        access the site or use our services.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
      <p className="mb-4">We may collect information about you in various ways:</p>
      
      <h3 className="text-xl font-semibold mt-6 mb-2">2.1 Personal Information</h3>
      <p className="mb-4">
        When you use our Platform, we may collect personally identifiable information, such as your:
      </p>
      <ul className="list-disc ml-8 mb-4">
        <li>Wallet address</li>
        <li>Email address (if provided)</li>
        <li>Usage data and analytics</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 mb-2">2.2 Non-Personal Information</h3>
      <p className="mb-4">
        We may also collect non-personal information about you whenever you interact with our Platform. Non-personal 
        information may include your browser name, the type of computer, technical information about your connection 
        to our Platform, and other similar information.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
      <p className="mb-4">We may use the information we collect about you for various purposes:</p>
      <ul className="list-disc ml-8 mb-4">
        <li>To provide and maintain our Platform</li>
        <li>To notify you about changes to our Platform</li>
        <li>To allow you to participate in interactive features of our Platform</li>
        <li>To provide customer support</li>
        <li>To gather analysis or valuable information to improve our Platform</li>
        <li>To monitor the usage of our Platform</li>
        <li>To detect, prevent, and address technical issues</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">4. Blockchain Data</h2>
      <p className="mb-4">
        Please be aware that all transactions conducted on the Solana blockchain are public and cannot be deleted or modified. 
        Your wallet address and transaction history on the blockchain are visible to anyone. We do not control the Solana blockchain 
        and are not responsible for any information that becomes publicly available through it.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">5. Cookies and Web Beacons</h2>
      <p className="mb-4">
        We may use cookies, web beacons, tracking pixels, and other tracking technologies to help customize the Platform and 
        improve your experience. For more information about how we use cookies, please refer to our Cookie Policy.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">6. Third-Party Websites</h2>
      <p className="mb-4">
        The Platform may contain links to third-party websites and applications. Once you leave our Platform, we cannot 
        be responsible for the protection and privacy of any information you provide while visiting such third-party websites. 
        These third-party sites are not governed by this Privacy Policy.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">7. Security of Your Information</h2>
      <p className="mb-4">
        We use administrative, technical, and physical security measures to protect your personal information. While we have 
        taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, 
        no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any 
        interception or other type of misuse.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">8. Children's Privacy</h2>
      <p className="mb-4">
        Our Platform is not intended for use by children under the age of 18. We do not knowingly collect or solicit personal 
        information from children. If we learn we have collected personal information from a child, we will delete that 
        information as quickly as possible.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to This Privacy Policy</h2>
      <p className="mb-4">
        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
        on this page and updating the "Last Updated" date at the top of this policy. You are advised to review this Privacy Policy 
        periodically for any changes.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
      <p className="mb-4">
        If you have any questions about this Privacy Policy, please contact us at{' '}
        <a 
          href="mailto:contact@maikers.com" 
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          aria-label="Contact email address"
        >
          {'contact' + '@' + 'maikers.com'}
        </a>.
      </p>
    </>
  );
} 