'use client';

import { usePageTitle } from '@/contexts/page-title-context';
import { useEffect } from 'react';

export default function CookiePolicy() {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('Cookie Policy');
  }, [setPageTitle]);

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
      <p className="mb-4">
        This Cookie Policy explains how POP Platform ("we", "our", or "us") uses cookies and similar technologies to recognize 
        you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to 
        control our use of them.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">2. What are Cookies?</h2>
      <p className="mb-4">
        Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are 
        widely used by website owners to make their websites work, or to work more efficiently, as well as to provide reporting 
        information.
      </p>
      <p className="mb-4">
        Cookies set by the website owner (in this case, POP Platform) are called "first-party cookies". Cookies set by parties 
        other than the website owner are called "third-party cookies". Third-party cookies enable third-party features or 
        functionality to be provided on or through the website (e.g., advertising, interactive content, and analytics). The 
        parties that set these third-party cookies can recognize your computer both when it visits the website in question and 
        also when it visits certain other websites.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">3. Why Do We Use Cookies?</h2>
      <p className="mb-4">
        We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order 
        for our website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also 
        enable us to track and target the interests of our users to enhance the experience on our website. Third parties serve 
        cookies through our website for analytics and other purposes.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">4. Types of Cookies We Use</h2>
      <p className="mb-4">The specific types of first and third-party cookies served through our website include:</p>

      <h3 className="text-xl font-semibold mt-6 mb-2">4.1 Essential Cookies</h3>
      <p className="mb-4">
        These cookies are strictly necessary to provide you with services available through our website and to use some of its
        features, such as access to secure areas. Because these cookies are strictly necessary to deliver the website, you 
        cannot refuse them without impacting how our website functions.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-2">4.2 Performance and Functionality Cookies</h3>
      <p className="mb-4">
        These cookies are used to enhance the performance and functionality of our website but are non-essential to their use. 
        However, without these cookies, certain functionality may become unavailable.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-2">4.3 Analytics and Customization Cookies</h3>
      <p className="mb-4">
        These cookies collect information that is used either in aggregate form to help us understand how our website is being 
        used or how effective our marketing campaigns are, or to help us customize our website for you.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">5. How to Control Cookies</h2>
      <p className="mb-4">
        You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by clicking 
        on the appropriate opt-out links provided in our cookie notice banner.
      </p>
      <p className="mb-4">
        You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may 
        still use our website though your access to some functionality and areas of our website may be restricted. As the means 
        by which you can refuse cookies through your web browser controls vary from browser-to-browser, you should visit your 
        browser's help menu for more information.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">6. Changes to This Cookie Policy</h2>
      <p className="mb-4">
        We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or 
        for other operational, legal, or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay 
        informed about our use of cookies and related technologies.
      </p>
      <p className="mb-4">
        The date at the top of this Cookie Policy indicates when it was last updated.
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">7. Contact Us</h2>
      <p className="mb-4">
        If you have any questions about our use of cookies or other technologies, please contact us at{' '}
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