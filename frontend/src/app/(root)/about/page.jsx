
import React from "react";

const AboutPage = () => {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero Section */}
      <section className="bg-blue-700 text-white py-20">
        <div className="w-[90%] lg:w-[80%] mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-5">
            About Yona Banking
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-blue-100">
            A modern digital banking application designed to make everyday
            banking simple, convenient, and accessible.
          </p>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16">
        <div className="w-[90%] lg:w-[80%] mx-auto">

          <div className="grid md:grid-cols-2 gap-10 items-center">

            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-5">
                What is Yona Banking?
              </h2>

              <p className="text-gray-600 leading-7 mb-4">
                Yona Banking is a full-stack digital banking application
                developed to provide users with a convenient way to manage
                their banking activities through a web interface.
              </p>

              <p className="text-gray-600 leading-7">
                The application brings essential banking services together
                in one place, allowing authenticated users to manage their
                accounts, transactions, cards, fund transfers, and fixed
                deposits.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-8">
              <h3 className="text-2xl font-semibold text-gray-800 mb-5">
                Our Goal
              </h3>

              <p className="text-gray-600 leading-7">
                Our goal is to provide a clean, user-friendly, and secure
                banking experience while demonstrating modern web development
                practices and reliable backend architecture.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="w-[90%] lg:w-[80%] mx-auto">

          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              Banking Features
            </h2>

            <p className="text-gray-600">
              Yona Banking provides several features for managing everyday
              banking activities.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

            <div className="p-6 rounded-xl bg-blue-50 border border-blue-100">
              <h3 className="text-xl font-semibold text-blue-700 mb-3">
                Account Management
              </h3>
              <p className="text-gray-600 leading-6">
                Manage your banking account and view important account
                information from one place.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-green-50 border border-green-100">
              <h3 className="text-xl font-semibold text-green-700 mb-3">
                Transactions
              </h3>
              <p className="text-gray-600 leading-6">
                Keep track of banking transactions and monitor your account
                activity.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-purple-50 border border-purple-100">
              <h3 className="text-xl font-semibold text-purple-700 mb-3">
                Fund Transfer
              </h3>
              <p className="text-gray-600 leading-6">
                Transfer funds between accounts through a convenient digital
                banking interface.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-orange-50 border border-orange-100">
              <h3 className="text-xl font-semibold text-orange-700 mb-3">
                ATM Services
              </h3>
              <p className="text-gray-600 leading-6">
                Access supported ATM-related functionality through the
                application.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-pink-50 border border-pink-100">
              <h3 className="text-xl font-semibold text-pink-700 mb-3">
                Fixed Deposits
              </h3>
              <p className="text-gray-600 leading-6">
                Manage fixed deposit services and access relevant deposit
                information.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-cyan-50 border border-cyan-100">
              <h3 className="text-xl font-semibold text-cyan-700 mb-3">
                Secure Authentication
              </h3>
              <p className="text-gray-600 leading-6">
                Authentication and protected routes help keep user banking
                functionality accessible only to authorized users.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-16">
        <div className="w-[90%] lg:w-[80%] mx-auto text-center">

          <h2 className="text-3xl font-bold text-gray-800 mb-5">
            Built with Modern Technology
          </h2>

          <p className="max-w-3xl mx-auto text-gray-600 leading-7 mb-8">
            Yona Banking uses a modern full-stack architecture with a
            Next.js frontend, Node.js backend, MongoDB database, authentication,
            API services, and state management.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Next.js",
              "React",
              "Node.js",
              "MongoDB",
              "Mongoose",
              "JWT",
              "Redux",
              "Tailwind CSS",
            ].map((technology) => (
              <span
                key={technology}
                className="px-4 py-2 bg-white border rounded-full
                           text-gray-700 font-medium shadow-sm"
              >
                {technology}
              </span>
            ))}
          </div>

        </div>
      </section>

      {/* Footer Message */}
      <section className="bg-gray-900 text-white py-10">
        <div className="w-[90%] lg:w-[80%] mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-3">
            Yona Banking
          </h2>

          <p className="text-gray-400">
            Simple. Convenient. Digital Banking.
          </p>
        </div>
      </section>

    </main>
  );
};

export default AboutPage;
