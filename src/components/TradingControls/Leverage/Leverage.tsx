import { useTrading } from "../../../contexts/TradingContext";

const Leverage = () => {
    const { marginMode, setMarginMode } = useTrading();

    return (
        <div className="flex gap-4">
            {["Cross", "Isolated"].map((option) => (
                <label key={option} className="flex items-center gap-1 cursor-pointer">
                    <input
                        type="radio"
                        name="marginType"
                        value={option}
                        checked={marginMode === option}
                        onChange={() => setMarginMode(option as "Cross" | "Isolated")}
                        className="sr-only"
                    />
                    <span className="w-4 h-4 relative">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                        >
                            <path
                                d="M14 8C14 4.6875 11.3125 2 8 2C4.6875 2 2 4.6875 2 8C2 11.3125 4.6875 14 8 14C11.3125 14 14 11.3125 14 8Z"
                                stroke="white"
                                strokeMiterlimit="10"
                            />
                            {marginMode === option && (
                                <path
                                    d="M8 12.5C10.4853 12.5 12.5 10.4853 12.5 8C12.5 5.51472 10.4853 3.5 8 3.5C5.51472 3.5 3.5 5.51472 3.5 8C3.5 10.4853 5.51472 12.5 8 12.5Z"
                                    fill="white"
                                />
                            )}
                        </svg>
                    </span>
                    <span className="text-[rgba(255,255,255,0.70)]">{option}</span>
                </label>
            ))}
        </div>
    )
}

export default Leverage