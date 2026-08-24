import React from 'react';
import { Instagram, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-200 font-sans p-6 md:p-12 selection:bg-indigo-500/30">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Instagram className="size-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-white italic group-hover:text-indigo-400 transition-colors">InstaFlow</span>
          </Link>
          <Link to="/" className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white flex items-center gap-2 transition-colors">
            <ArrowLeft className="size-3" /> Back to Home
          </Link>
        </header>

        <section className="bg-[#161618] border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <h1 className="text-4xl font-light text-white tracking-tight italic mb-8">Privacy Policy</h1>
          
          <div className="space-y-8 text-white/60 leading-relaxed font-medium">
            <p className="italic">Last Updated: April 23, 2026</p>

            <div>
              <h2 className="text-xl font-medium text-white mb-4 italic">1. Introduction</h2>
              <p>
                Welcome to InstaFlow ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-medium text-white mb-4 italic">2. Data We Collect</h2>
              <p>
                When you use InstaFlow through the Meta/Instagram API, we may collect:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Your Instagram account ID and username.</li>
                <li>Meta authentication tokens to perform authorized actions.</li>
                <li>Content of messages or comments intended for automation based on your triggers.</li>
                <li>Email address and basic profile information provided via Google/Email login.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-medium text-white mb-4 italic">3. How We Use Data</h2>
              <p>
                We use the data strictly for providing the automation services you configure:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Detecting keywords in your Instagram comments/mentions.</li>
                <li>Sending automated DMs on your behalf as configured in your flows.</li>
                <li>Providing analytics on your automation performance.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-medium text-white mb-4 italic">4. Data Security</h2>
              <p>
                InstaFlow uses industry-standard encryption and security protocols to protect your Meta access tokens and personal information. We do not store your Instagram password.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-medium text-white mb-4 italic">5. Meta Platform Policy Compliance</h2>
              <p>
                Our application complies with the Meta Platform Terms and Developer Policies. We only access data for which you have specifically granted permission through the official OAuth flow.
              </p>
            </div>

            <div className="pt-8 border-t border-white/5 text-sm">
              <p>If you have any questions about this Privacy Policy, please contact us at privacy@instaflow.example.</p>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[120px] opacity-10 -translate-y-1/2 translate-x-1/2" />
        </section>

        <footer className="mt-12 text-center">
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.3em]">InstaFlow Compliance Team</p>
        </footer>
      </div>
    </div>
  );
}
