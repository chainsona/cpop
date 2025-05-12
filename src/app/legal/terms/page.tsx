'use client';

import { usePageTitle } from '@/contexts/page-title-context';
import { useEffect } from 'react';

export default function TermsOfService() {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('Terms of Service');
  }, [setPageTitle]);

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
      <p className="mb-4">
        Welcome to POP Platform. These Terms of Service govern your use of our website and services.
        By accessing or using our platform, you agree to be bound by these Terms. If you disagree with
        any part of the terms, you may not access the service.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">2. Definitions</h2>
      <p className="mb-4">
        <strong>POP:</strong> Proof of Participation Protocol, which is a digital collectible that represents proof of participation in an event.
      </p>
      <p className="mb-4">
        <strong>Platform:</strong> The websites, applications, and services provided by POP Platform.
      </p>
      <p className="mb-4">
        <strong>User:</strong> Any individual who accesses or uses the Platform.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">3. Account Registration</h2>
      <p className="mb-4">
        To use certain features of the Platform, you may need to connect a wallet. You agree to provide
        accurate and complete information when connecting your wallet and to update such information as necessary
        to keep it accurate and complete.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">4. User Conduct</h2>
      <p className="mb-4">
        You agree not to use the Platform to:
      </p>
      <ul className="list-disc ml-8 mb-4">
        <li>Violate any applicable law or regulation.</li>
        <li>Infringe the rights of any third party, including intellectual property rights.</li>
        <li>Transmit any material that is defamatory, offensive, or otherwise objectionable.</li>
        <li>Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person or entity.</li>
        <li>Engage in any activity that could disable, overburden, or impair the proper working of the Platform.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">5. Intellectual Property</h2>
      <p className="mb-4">
        The Platform and its content, features, and functionality are owned by POP Platform and are protected by copyright,
        trademark, and other intellectual property laws. You may not reproduce, distribute, modify, create derivative works of,
        publicly display, publicly perform, republish, download, store, or transmit any of the material on our Platform without
        our prior written consent.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">6. Blockchain Transactions</h2>
      <p className="mb-4">
        The Platform integrates with blockchain technology, specifically the Solana blockchain. By using the Platform,
        you acknowledge and agree that blockchain transactions are irreversible and that we have no control over the
        Solana blockchain. You are solely responsible for the security of your wallet and private keys.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">7. Disclaimers</h2>
      <p className="mb-4">
        The Platform is provided on an "as is" and "as available" basis. We make no warranties, expressed or implied,
        regarding the operation of the Platform or the information, content, materials, or products included on the Platform.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
      <p className="mb-4">
        In no event shall POP Platform be liable for any indirect, incidental, special, consequential, or punitive damages,
        including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from
        your access to or use of or inability to access or use the Platform.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to Terms</h2>
      <p className="mb-4">
        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material,
        we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change
        will be determined at our sole discretion.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
      <p className="mb-4">
        If you have any questions about these Terms, please contact us at{' '}
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