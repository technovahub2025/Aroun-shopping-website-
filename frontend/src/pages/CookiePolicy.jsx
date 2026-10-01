

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-6 md:p-10">

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Cookie Policy
        </h1>

        <p className="text-sm text-gray-500 mb-8">
          Last Updated: October 1, 2026
        </p>

        <div className="space-y-8 text-gray-600 leading-7">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              What Are Cookies?
            </h2>

            <p>
              Cookies are small files stored on your device when you visit
              a website. They help websites remember information and provide
              a smoother browsing experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              How We Use Cookies
            </h2>

            <p className="mb-3">
              Aroun Stores may use cookies to:
            </p>

            <ul className="list-disc pl-6 space-y-2">
              <li>Keep you logged in</li>
              <li>Remember your shopping cart</li>
              <li>Remember your preferences</li>
              <li>Improve website performance</li>
              <li>Understand how visitors use our website</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Managing Cookies
            </h2>

            <p>
              You can manage or disable cookies through your browser settings.
              However, disabling certain cookies may affect some features of
              the website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Third-Party Services
            </h2>

            <p>
              Some services used by our website may use cookies or similar
              technologies. These services may have their own privacy and
              cookie policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Changes to This Policy
            </h2>

            <p>
              We may update this Cookie Policy when needed. Any changes will
              be posted on this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Contact Us
            </h2>

            <div className="space-y-2">
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

export default CookiePolicy;
