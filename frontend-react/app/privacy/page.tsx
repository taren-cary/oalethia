'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen relative">
      <Navigation />
      <div className="relative z-10 pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold cosmic-text mb-8 text-center">
            Privacy Policy
          </h1>
          
          <div className="glass-card p-8 space-y-6 text-white/90">
            <p className="text-sm text-white/70 mb-6">
              Last updated: March 2026
            </p>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">1. Introduction</h2>
              <p className="mb-4">
                Oalethia ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Oalethia website, StarManifest™ web app, and our Oalethia mobile applications for iOS and Android (together, the "Service").
              </p>
              <p className="mb-4">
                This single Privacy Policy applies to both the website and the mobile apps. By accessing or using any part of the Service, you agree to the collection and use of information in accordance with this Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold mb-3 text-white mt-4">Personal Information You Provide</h3>
              <p className="mb-4">
                We collect information that you provide directly to us when you create an account, use the Service, or contact us, including:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>Email address and account credentials</li>
                <li>Profile details you choose to provide (such as name or display name)</li>
                <li>Birth date, birth time, and birth location (for astrological calculations)</li>
                <li>Goals, outcomes, intentions, context, and other text or content you enter for timeline generation or in-app notes</li>
                <li>Subscription and billing information (such as product purchased, renewal status, and limited transaction details)</li>
                <li>Support requests, feedback, and other communications you send to us</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-white mt-4">Usage, Device, and Log Information</h3>
              <p className="mb-4">
                We automatically collect certain information when you access or use the website or mobile apps, including:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>Device information (such as device type, operating system, app version, and browser type)</li>
                <li>IP address and approximate location inferred from IP</li>
                <li>Usage data about how you interact with the Service (such as pages/screens viewed, features used, actions taken, and timestamps)</li>
                <li>Error logs, crash reports, and performance data (including data collected via Sentry)</li>
                <li>In-app purchase and subscription events (such as product identifiers, purchase status, and timestamps)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">3. How We Use Your Information</h2>
              <p className="mb-4">We use the information we collect, on both the website and in the mobile apps, to:</p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>Provide, operate, and maintain the Service (web and mobile)</li>
                <li>Generate personalized astrological timelines, action plans, and AI-powered content tailored to you</li>
                <li>Manage accounts, subscriptions, and in-app purchases, including verifying eligibility and entitlements</li>
                <li>Process payments and fulfill orders (via our payment and app store providers)</li>
                <li>Communicate with you about the Service, including transactional messages, updates, and support responses</li>
                <li>Improve and develop the Service, including through analytics, A/B testing, and user research</li>
                <li>Monitor and analyze usage patterns to enhance performance and user experience</li>
                <li>Protect the Service and our users, including detecting, preventing, and responding to fraud, abuse, and security incidents</li>
                <li>Comply with legal obligations and enforce our terms and policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">4. Data Storage and Security</h2>
              <p className="mb-4">
                Your data is stored securely using Supabase and other cloud infrastructure providers that offer modern security controls. We implement appropriate technical and organizational measures designed to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              <p className="mb-4">
                Data is encrypted in transit, and we limit access to personal data to personnel and service providers who need it to perform their duties. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">5. Data Sharing and Disclosure</h2>
              <p className="mb-4">
                We do not sell your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>
                  <strong>Service Providers and Processors:</strong> We share information with third-party vendors who help us operate the Service, such as hosting, databases, analytics, error monitoring, email delivery, and customer support.
                </li>
                <li>
                  <strong>Payment and App Store Providers:</strong> We share limited information with payment processors and app store platforms as needed to process payments, manage subscriptions, and handle refunds or disputes.
                </li>
                <li>
                  <strong>AI and Analytics Providers:</strong> We send certain input text and context to AI and analytics providers to generate timelines, improve models, and understand how the Service is used.
                </li>
                <li>
                  <strong>Legal Requirements and Protection:</strong> We may disclose information if required to do so by law or in response to valid requests by public authorities, or when necessary to protect our rights, users, or the public.
                </li>
                <li>
                  <strong>Business Transfers:</strong> In the event of a merger, acquisition, reorganization, or sale of assets, your information may be transferred as part of that transaction, subject to this Privacy Policy.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">6. Third-Party Services and Payments</h2>
              <p className="mb-4">
                Our Service integrates with several third-party services. These partners may process your personal data as independent controllers or as our processors, depending on the context. Their use of your data is governed by their own privacy policies.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-white mt-4">Payments and Subscriptions</h3>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>
                  <strong>Website (Stripe):</strong> On the website, payments are processed by Stripe. Stripe handles your payment card details directly; we do not store full card numbers or security codes. For more information, please review Stripe&apos;s privacy policy at{" "}
                  <a
                    href="https://stripe.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-300 hover:text-blue-200"
                  >
                    https://stripe.com/privacy
                  </a>
                  .
                </li>
                <li>
                  <strong>Mobile Apps (Apple App Store and Google Play):</strong> In the iOS and Android apps, in-app purchases and subscriptions are processed by Apple (App Store) and Google (Play Store). These platforms handle your payment details and billing. We receive purchase and subscription information (such as product identifiers, status, and expiration dates) so we can provide access to premium features. For more information, please refer to Apple&apos;s and Google&apos;s policies (including their privacy policies and store terms).
                </li>
              </ul>

              <p className="mb-4">
                In all cases, we do not directly store or have access to your full payment card details. Payment processors and app store providers handle that information on our behalf or as independent controllers.
              </p>

              <h3 className="text-xl font-semibold mb-3 text-white mt-4">AI, Error Monitoring, and Infrastructure</h3>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>
                  <strong>OpenAI:</strong> We use OpenAI to power AI-based features, including generating timelines and related content based on the information you provide. The text and context you submit for these features may be sent to OpenAI to generate responses, in accordance with OpenAI&apos;s terms and privacy practices.
                </li>
                <li>
                  <strong>Sentry:</strong> We use Sentry for error tracking and performance monitoring. When errors occur, Sentry may receive technical data such as device information, app version, stack traces, and limited contextual data to help us diagnose and fix issues.
                </li>
                <li>
                  <strong>Supabase and Hosting Providers:</strong> We use Supabase for authentication, database, and storage, and other cloud providers to host and run the Service. These providers store and process your data on our behalf in order to deliver the Service reliably and securely.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">7. Your Rights, Choices, and Account Deletion</h2>
              <p className="mb-4">
                Depending on where you live, you may have certain rights in relation to your personal data under applicable data protection laws (such as the EU/UK GDPR or similar laws). Subject to legal limitations, these may include the right to:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                <li>Access and receive a copy of your personal data</li>
                <li>Rectify inaccurate or incomplete data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to or restrict processing of your data</li>
                <li>Data portability (receive your data in a structured, commonly used, machine-readable format)</li>
                <li>Withdraw consent at any time where processing is based on consent</li>
                <li>Lodge a complaint with a data protection authority in your country or region</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 text-white mt-4">Account Deletion and Data Removal</h3>
              <p className="mb-4">
                You can delete your account and associated data directly from within the Oalethia mobile app by going to <strong>Profile → Settings → Delete account</strong>. When you complete this flow, your account, associated profile data, and authentication record are deleted from our systems, subject to limited retention where required for legal, accounting, or fraud-prevention purposes.
              </p>
              <p className="mb-4">
                If you use the web app or cannot access the in-app deletion flow, you can also request deletion or access to your data by contacting us at{" "}
                <a
                  href="mailto:support@oalethia.com"
                  className="underline text-blue-300 hover:text-blue-200"
                >
                  support@oalethia.com
                </a>
                . We may need to verify your identity before fulfilling your request.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">8. Data Retention</h2>
              <p className="mb-4">
                We retain your personal information for as long as necessary to provide the Service, fulfill the purposes described in this Privacy Policy, and comply with our legal obligations. When you delete your account (for example, through the in-app deletion flow), we delete or anonymize your personal data, except where we are required or permitted to retain certain information for legal, tax, accounting, security, or legitimate business reasons (such as maintaining limited records of transactions or consent).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">9. Children&apos;s Privacy</h2>
              <p className="mb-4">
                The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe that a child has provided us with personal information, please contact us, and we will take appropriate steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">10. International Data Transfers</h2>
              <p className="mb-4">
                Your information may be transferred to and processed in countries other than your country of residence, including countries that may have data protection laws different from those in your jurisdiction. Where required, we take steps to ensure that appropriate safeguards are in place for such transfers, such as standard contractual clauses or equivalent mechanisms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">11. Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. In some cases, we may provide additional notice (such as by sending a notification in the app or by email). We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-white">12. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this Privacy Policy or our data practices, or if you would like to exercise your privacy rights, please contact us at{" "}
                <a
                  href="mailto:support@oalethia.com"
                  className="underline text-blue-300 hover:text-blue-200"
                >
                  support@oalethia.com
                </a>
                .
              </p>
            </section>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="glass-button px-6 py-3 inline-block">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

