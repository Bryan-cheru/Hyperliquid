interface Props {
    accNum: number;
}

const Navbar = ({ accNum }: Props) => {

  return (
      <nav className="bg-[#252930] w-full">
          <div className="boxShadow flex items-center justify-between px-5 py-[21px] roboto">
              <div className="flex gap-2.5 items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="34" height="35" viewBox="0 0 34 35" fill="none">
                      <path d="M15.5833 22.45C15.5833 22.0634 15.2699 21.75 14.8833 21.75H9.63262C9.11226 21.75 8.77381 21.2024 9.00652 20.737L17.0906 4.56889C17.4209 3.90821 18.4167 4.14328 18.4167 4.88193V12.55C18.4167 12.9366 18.7301 13.25 19.1167 13.25H24.3674C24.8877 13.25 25.2262 13.7976 24.9935 14.2631L16.9094 30.4312C16.5791 31.0918 15.5833 30.8568 15.5833 30.1181V22.45Z" fill="url(#paint0_linear_55_1862)" />
                      <defs>
                          <linearGradient id="paint0_linear_55_1862" x1="12.0417" y1="3.33335" x2="21.25" y2="34.5" gradientUnits="userSpaceOnUse">
                              <stop stopColor="#F0B90B" />
                              <stop offset="1" stopColor="#F25D52" />
                          </linearGradient>
                      </defs>
                  </svg>
                  <h1 className="text-[#F0B90B] text-[29.6px] font-extrabold">Hyper Max</h1>
              </div>

              <div className="flex gap-8 mr-3">
                  <div className="flex gap-1.5 items-center">
                      <div className="bg-[#00FF4D] rounded-full w-[9px] h-[9px]"></div>
                      <p className="text-base text-[#FBF9F9]">Connected</p>
                  </div>

                  <div>
                      <p className="text-[#FBF9F9] text-base">Active Orders: <span className="text-white font-bold">23</span></p>
                  </div>

                  <div>
                      <p className="text-base text-[#FBF9F9]">Total PnL: <span className="font-bold text-[rgba(0,255,76,0.80)]">+$1,247.83</span></p>
                  </div>

                  <div>
                      <p className="text-base text-[#FBF9F9]">Accounts: <span className="font-bold text-white">{accNum}/10</span></p>
                  </div>
              </div>
        </div>
    </nav>
  )
}

export default Navbar