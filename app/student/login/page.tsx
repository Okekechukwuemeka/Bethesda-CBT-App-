'use client'

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#E8F0FE] flex items-center justify-center px-4 py-8 font-sans">
      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#B8D0E8]">
        {/* Header with Branding - Blue Theme */}
        <div className="bg-[#1A3A5C] px-6 py-10 text-center">
          <h1 className="text-3xl font-bold text-white tracking-wide">
            BETHESDA HOME
          </h1>
          <p className="text-[#8BB8E8] text-lg font-medium -mt-1">
            &amp; SCHOOL FOR THE BLIND
          </p>
          <div className="w-16 h-1 bg-[#5B9BD5] mx-auto mt-3 rounded-full"></div>
        </div>

        {/* Login Form */}
        <div className="px-6 py-8 sm:px-8">
          <h2 className="text-2xl font-semibold text-[#1A3A5C] text-center mb-6">
            Sign In
          </h2>

          <form className="space-y-5" noValidate>
            {/* Admission No. Field */}
            <div>
              <label htmlFor="admissionNo" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Admission No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="admissionNo"
                name="admissionNo"
                autoComplete="username"
                required
                aria-required="true"
                placeholder="Enter your admission number"
                className="w-full px-4 py-3 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent transition bg-[#F8FAFE] text-[#1A1A1A] placeholder:text-[#8A9CAE]"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="current-password"
                required
                aria-required="true"
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent transition bg-[#F8FAFE] text-[#1A1A1A] placeholder:text-[#8A9CAE]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#1A3A5C] hover:bg-[#14304D] text-white font-semibold py-3 px-4 rounded-lg transition duration-200 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.99]"
            >
              Sign In
            </button>
          </form>

          {/* Support Link */}
          <div className="mt-6 text-center">
            <a
              href="#"
              className="text-sm text-[#2B6CB0] hover:text-[#1A3A5C] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded px-1"
            >
              Need help signing in?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;