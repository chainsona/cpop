'use client';

import { Container } from '@/components/ui/container';
import Link from 'next/link';

// Reusable components to reduce repetition
const FooterHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{children}</h3>
);

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <Link
      href={href}
      className="text-neutral-600 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 text-sm"
    >
      {children}
    </Link>
  </li>
);

const ExternalLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <a
      href={href}
      className="text-neutral-600 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 text-sm"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  </li>
);

const SocialIcon = ({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) => (
  <a
    href={href}
    className="text-neutral-600 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400"
    target="_blank"
    rel="noopener noreferrer"
  >
    <span className="sr-only">{label}</span>
    {icon}
  </a>
);

export function FooterSection() {
  return (
    <footer className="bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
      <Container>
        <div className="py-8 sm:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-2 md:col-span-1 space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">POP</h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-xs">
                Create, distribute and manage digital proof of participation tokens for your events
                and communities.
              </p>
              <div className="flex space-x-4">
                <SocialIcon
                  href="https://x.com/chainsona"
                  label="Twitter"
                  icon={
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  }
                />
                <SocialIcon
                  href="https://github.com/chainsona/cpop"
                  label="GitHub"
                  icon={
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                />
                <SocialIcon
                  href="https://discord.com/invite/qCv4Y7uYmh"
                  label="Discord"
                  icon={
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.39-.444.885-.608 1.282a18.271 18.271 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.282.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.032.028C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.129 12.299 12.299 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  }
                />
              </div>
            </div>

            <div>
              <FooterHeading>Platform</FooterHeading>
              <ul className="space-y-2">
                <FooterLink href="/pops">Explore Events</FooterLink>
                <FooterLink href="/pops/create">Create POP</FooterLink>
                <FooterLink href="#features">Features</FooterLink>
                <FooterLink href="#how-it-works">How It Works</FooterLink>
              </ul>
            </div>

            <div>
              <FooterHeading>Resources</FooterHeading>
              <ul className="space-y-2">
                <FooterLink href="#faq">FAQ</FooterLink>
                <ExternalLink href="https://github.com/chainsona/cpop">Documentation</ExternalLink>
                <ExternalLink href="https://x.com/chainsona">Support</ExternalLink>
              </ul>
            </div>

            <div>
              <FooterHeading>Legal</FooterHeading>
              <ul className="space-y-2">
                <FooterLink href="/legal/privacy">Privacy Policy</FooterLink>
                <FooterLink href="/legal/terms">Terms of Service</FooterLink>
                <FooterLink href="/legal/cookies">Cookie Policy</FooterLink>
              </ul>
            </div>
          </div>
        </div>

        <div className="py-4 sm:py-6 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              &copy; {new Date().getFullYear()} SOONA. All rights reserved.
            </p>
            <div className="mt-2 sm:mt-0">
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-500">
                Built on Solana
              </p>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
