
const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-6 md:p-10">

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Privacy Policy
        </h1>

        <p className="text-sm text-gray-500 mb-8">
          Last Updated: October 1, 2026
        </p>

        <div className="space-y-8 text-gray-600 leading-7">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Introduction
            </h2>
            <p>
              At Aroun Stores, we respect your privacy. This Privacy Policy
              explains what information we collect and how we use it when you
              use our website and services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Information We Collect
            </h2>
            <p className="mb-3">
              When you use our website, we may collect information such as:
            </p>

            <ul className="list-disc pl-6 space-y-2">
              <li>Name</li>
              <li>Phone number</li>
              <li>Email address</li>
              <li>Delivery address</li>
              <li>Order details</li>
              <li>Account information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              How We Use Your Information
            </h2>

            <p className="mb-3">
              We may use your information to:
            </p>

            <ul className="list-disc pl-6 space-y-2">
              <li>Process and deliver your orders</li>
              <li>Contact you about your orders</li>
              <li>Provide customer support</li>
              <li>Manage your account</li>
              <li>Improve our website and services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Sharing of Information
            </h2>
            <p>
              We do not sell your personal information. We may share necessary
              information with service providers when required to process
              payments, deliver orders, or provide other services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Data Security
            </h2>
            <p>
              We take reasonable steps to protect your personal information
              from unauthorized access, misuse, or disclosure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes
              will be posted on this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Contact Us
            </h2>

            <p>
              If you have any questions about this Privacy Policy, you can
              contact us:
            </p>

            <div className="mt-4 space-y-2">
              <p>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:contact@arounstores.com"
                  className="text-green-600 hover:underline"
                >
                  contact@arounstores.com
                </a>
              </p>

              <p>
                <strong>Phone:</strong>{" "}
                <a
                  href="tel:+919629600230"
                  className="text-green-600 hover:underline"
                >
                  +91 9629600230
                </a>
              </p>

              <p>
                <strong>Location:</strong> Lawspet, Puducherry
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

