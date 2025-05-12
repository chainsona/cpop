'use client';

import { Container } from '@/components/ui/container';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// FAQ data
const faqs = [
  {
    question: 'What is a POP?',
    answer:
      "POP (Proof of Participation) is a digital badge stored on the blockchain that proves you participated in an event, whether online or in-person. It's like a digital ticket stub or commemorative badge that can't be forged or duplicated.",
  },
  {
    question: 'How do I create a POP for my event?',
    answer:
      'Simply sign up for an account, use our design tools to create your POP, set up your distribution method, and share with your attendees. Our platform handles all the technical aspects of minting and blockchain storage.',
  },
  {
    question: 'How much does it cost?',
    answer:
      'We offer a free tier for small events, with premium tiers available for larger events and additional features. Visit our pricing page for current rates and options.',
  },
  {
    question: 'Can attendees claim POPs without technical knowledge?',
    answer:
      "Absolutely! Attendees can claim POPs using simple QR codes or claim links. They don't need any blockchain knowledge to collect their digital badges.",
  },
  {
    question: 'Are POPs environmentally friendly?',
    answer:
      'Yes, our POPs use energy-efficient blockchain technology that minimizes environmental impact while providing secure, permanent storage.',
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
            Everything you need to know about POPs and our platform.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  );
}
