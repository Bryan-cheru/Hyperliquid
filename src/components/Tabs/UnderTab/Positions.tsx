const Postions = () => {
    return (
        // Outer container for the entire Positions component
        <article className="text-xs inter rounded-[8px] text-[#A0A9B4] mr-[23px]">
            
            {/* Header row: scrollable, sticky top bar with column titles */}
            <div className="flex overflow-x-auto no-scrollbar border-b border-[#2A3441] bg-[#151C26] p-[12px_16px_13px_16px] items-center font-medium gap-x-4">
                
                {/* Column header: Coin */}
                <div className="min-w-[70px] text-[10px] flex items-center ml-3">Coin</div>

                {/* Column header: Size */}
                <div className="min-w-[70px] text-[10px] flex items-center">Size</div>

                {/* Column header: Position Value with an icon */}
                <div className="min-w-[120px] text-[10px] flex items-center gap-1">
                    <p>Position Value</p>
                    {/* Downward arrow icon (indicates sortable column maybe) */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M12 12H0V0H12V12Z"/>
                        <path 
                            d="M5.47012 9.52949C5.76309 9.82246 6.23887 9.82246 6.53184 9.52949L11.0318 5.02949C11.3248 4.73652 11.3248 4.26074 11.0318 3.96777C10.7389 3.6748 10.2631 3.6748 9.97012 3.96777L5.9998 7.93809L2.02949 3.97012C1.73652 3.67715 1.26074 3.67715 0.967773 3.97012C0.674805 4.26309 0.674805 4.73887 0.967773 5.03184L5.46777 9.53184L5.47012 9.52949Z" 
                            fill="#A0A9B4" 
                        />
                    </svg>
                </div>

                {/* Column header: Entry Price */}
                <div className="min-w-[90px] text-[10px] flex items-center">Entry Price</div>

                {/* Column header: Mark Price */}
                <div className="min-w-[90px] text-[10px] flex items-center">Mark Price</div>

                {/* Column header: Profit & Loss and Return on Equity */}
                <div className="min-w-[90px] text-[10px] flex items-center">PNL (ROE%)</div>

                {/* Column header: Liquidation Price */}
                <div className="min-w-[90px] text-[10px] flex items-center">Liq. Price</div>

                {/* Column header: Margin */}
                <div className="min-w-[20px] text-[10px] flex items-center">Margin</div>
            </div>

            {/* Main content area where actual position rows or placeholder content will be rendered */}
            <article className="flex flex-col justify-center items-center h-[588px]">
                {/* Content (position rows or empty state) will go here */}
            </article>
        </article>
    );
};

export default Postions;
