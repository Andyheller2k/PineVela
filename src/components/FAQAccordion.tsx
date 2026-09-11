import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { ChevronDown, HelpCircle, ShieldAlert, Award, FileText, CheckCircle, Clock } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  icon?: React.ReactNode;
}

// Custom wrapper that leverages Framer Motion scroll listener to fade items in/out relative to scroll position
function ScrollFadeWrapper({ children, id }: { children: React.ReactNode; id?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Map scroll progress to opacity and vertical translation
  // 0 is when top of card enters bottom of viewport
  // 0.25 is when it is fully in
  // 0.75 is when it starts exiting the top of viewport
  // 1.0 is when it is completely out of the top of viewport
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.15, 1, 1, 0.15]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [25, 0, 0, -25]);

  return (
    <motion.div
      ref={containerRef}
      id={id}
      style={{ opacity, y }}
      className="will-change-transform duration-100"
    >
      {children}
    </motion.div>
  );
}

export default function FAQAccordion() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const managerFaqs: FAQItem[] = [
    {
      question: "How do I become a hostel manager?",
      answer: "To become a hostel manager, navigate to the Portal Login and select the 'Register as Manager' onboarding option. You will be guided through our onboarding gateway to establish your account and register your residency.",
      icon: <Award className="text-blue-600" size={16} />
    },
    {
      question: "Why does manager registration require verification?",
      answer: "Verification is vital for PineVela to ensure the safety, legitimacy, and comfort of all listed residencies. We manually authenticate profiles to build a high-trust, secure living ecosystem for our student residents.",
      icon: <ShieldAlert className="text-amber-500" size={16} />
    },
    {
      question: "What documents/information are required?",
      answer: "You are required to submit your legal contact name, verified email, official residency address, detailed room capacities, operational rules, and precise geographic coordinates for map placement.",
      icon: <FileText className="text-indigo-500" size={16} />
    },
    {
      question: "How long does verification take?",
      answer: "Our verification team typically reviews manager registration applications and hostel onboarding specifications within 24 to 48 business hours of submission.",
      icon: <Clock className="text-emerald-500" size={16} />
    },
    {
      question: "What happens after I submit my application?",
      answer: "Upon submission, your profile status enters a pending queue. You will gain temporary portal access to configure room options while our compliance team reviews your listing properties.",
      icon: <CheckCircle className="text-blue-500" size={16} />
    },
    {
      question: "Why was my application rejected?",
      answer: "Rejections are usually caused by incomplete credentials, unverified phone lines, inaccurate coordinate mappings, or mismatching regional authority approvals.",
      icon: <ShieldAlert className="text-red-500" size={16} />
    },
    {
      question: "Can I resubmit my application?",
      answer: "Absolutely. If rejected, you will receive concrete corrective action points. You can modify your registration details inside the onboarding wizard and resubmit for immediate re-evaluation.",
      icon: <CheckCircle className="text-teal-500" size={16} />
    }
  ];

  const generalFaqs: FAQItem[] = [
    {
      question: "What amenities are included in the residency fee?",
      answer: "All PineVela hosteleries feature 24/7 backup power, high-speed WiFi (up to 150 Mbps), laundry services, biometric access controls, and 24-hour security guards on duty.",
      icon: <HelpCircle className="text-blue-900" size={16} />
    },
    {
      question: "How are maintenance requests and issue reports handled?",
      answer: "Once checked in, students can file digital maintenance reports directly through their student dashboard. Resident staff and maintenance technicians are immediately notified to address requests within 24 hours.",
      icon: <HelpCircle className="text-blue-900" size={16} />
    },
    {
      question: "Can I schedule a physical tour of the hostel?",
      answer: "Yes! You can view each property's resident manager contact phone and information directly on their details card to organize an on-site walkthrough.",
      icon: <HelpCircle className="text-blue-900" size={16} />
    }
  ];

  return (
    <div id="faq-accordion-section" className="space-y-12">
      {/* Category: Manager Registration */}
      <div className="space-y-6">
        <div className="border-l-4 border-blue-900 pl-4 py-1">
          <h4 className="text-lg font-black text-slate-900 tracking-tight">
            Manager Registration
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            This is especially important for PineVela. Understand the verification and application cycle.
          </p>
        </div>

        <div className="grid gap-4">
          {managerFaqs.map((faq, index) => {
            const globalIndex = index;
            const isOpen = expandedIndex === globalIndex;
            return (
              <ScrollFadeWrapper key={faq.question} id={`faq-manager-scroll-${index}`}>
                <div
                  id={`faq-manager-item-${index}`}
                  className="bg-blue-50/20 border border-blue-200/25 rounded-2xl shadow-xs overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedIndex(isOpen ? null : globalIndex)}
                    className="w-full px-6 py-4.5 flex items-center justify-between text-left focus:outline-none hover:bg-blue-50/45 transition-colors cursor-pointer group"
                  >
                    <span className="flex items-center gap-3 font-bold text-slate-850 text-sm md:text-base leading-tight group-hover:text-blue-900 transition-colors">
                      {faq.icon}
                      {faq.question}
                    </span>
                    <span className="ml-4 shrink-0 p-1.5 rounded-lg bg-blue-50/50 text-slate-500 group-hover:text-blue-900 transition-colors">
                      <ChevronDown
                        size={16}
                        className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-900' : ''}`}
                      />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-5 text-xs md:text-sm text-slate-600 leading-relaxed border-t border-blue-200/10 pt-4">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollFadeWrapper>
            );
          })}
        </div>
      </div>

      {/* Category: General Questions */}
      <div className="space-y-6 pt-6 border-t border-slate-100">
        <div className="border-l-4 border-slate-400 pl-4 py-1">
          <h4 className="text-lg font-black text-slate-800 tracking-tight">
            General Residency Info
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            General living, amenities, and resident guidance.
          </p>
        </div>

        <div className="grid gap-4">
          {generalFaqs.map((faq, index) => {
            const globalIndex = managerFaqs.length + index;
            const isOpen = expandedIndex === globalIndex;
            return (
              <ScrollFadeWrapper key={faq.question} id={`faq-general-scroll-${index}`}>
                <div
                  id={`faq-general-item-${index}`}
                  className="bg-blue-50/20 border border-blue-200/25 rounded-2xl shadow-xs overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedIndex(isOpen ? null : globalIndex)}
                    className="w-full px-6 py-4.5 flex items-center justify-between text-left focus:outline-none hover:bg-blue-50/45 transition-colors cursor-pointer group"
                  >
                    <span className="flex items-center gap-3 font-bold text-slate-850 text-sm md:text-base leading-tight group-hover:text-blue-900 transition-colors">
                      {faq.icon}
                      {faq.question}
                    </span>
                    <span className="ml-4 shrink-0 p-1.5 rounded-lg bg-blue-50/50 text-slate-500 group-hover:text-blue-900 transition-colors">
                      <ChevronDown
                        size={16}
                        className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-900' : ''}`}
                      />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-5 text-xs md:text-sm text-slate-600 leading-relaxed border-t border-blue-200/10 pt-4">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollFadeWrapper>
            );
          })}
        </div>
      </div>
    </div>
  );
}
