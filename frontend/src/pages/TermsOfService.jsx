

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-6 md:p-10">

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Terms of Service
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
              Welcome to Aroun Stores. By using our website, you agree to
              follow these Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Orders
            </h2>
            <p>
              Please provide accurate information when placing an order.
              We may cancel or modify an order if a product is unavailable
              or if there is an issue with the order information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Products and Prices
            </h2>
            <p>
              We try to keep product names, descriptions, images, prices,
              and availability accurate. Prices and product availability
              may change without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Delivery
            </h2>
            <p>
              We will make reasonable efforts to deliver your order within
              the estimated delivery time. Delivery times may vary because
              of traffic, weather, product availability, or other unexpected
              circumstances.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Payments
            </h2>
            <p>
              Payments must be completed using the payment methods available
              on our website. You are responsible for providing correct
              payment information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Returns and Refunds
            </h2>
            <p>
              Returns, cancellations, and refunds will be handled according
              to the applicable return and refund rules of Aroun Stores.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Website Use
            </h2>
            <p>
              You agree not to misuse the website, attempt unauthorized
              access, interfere with website functionality, or use the
              website for unlawful purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Changes to These Terms
            </h2>
            <p>
              We may update these Terms of Service from time to time.
              Updated terms will be posted on this page.
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

export default TermsOfService;
