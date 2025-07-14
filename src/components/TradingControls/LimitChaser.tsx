import * as Slider from "@radix-ui/react-slider";
import { useState } from "react";

interface Props {
    clicked: boolean;
    setClicked: React.Dispatch<React.SetStateAction<boolean>>;
}

// LimitChaser component allows toggling limit mode and configuring price limits
const LimitChaser = ({ clicked, setClicked }: Props) => {
    const [value, setValue] = useState<number[]>([0]); // Slider value (0–500)
    const [filled, setFilled] = useState<boolean>(false); // Toggle for "Filled or Cancel"

    return (
        <div className="border-t border-[#373A45] pt-4">
            <div className="flex flex-col gap-5">
                
                {/* Toggle Checkbox and Heading */}
                <div className="flex gap-3 items-center -mb-2">
                    <label className="relative cursor-pointer flex">
                        <input
                            type="checkbox"
                            onChange={() => setClicked(prev => !prev)}
                            checked={clicked}
                            className="cursor-pointer peer appearance-none h-[22px] w-[22px] shrink-0 rounded-xs border-2 border-[#787b7f] bg-transparent checked:bg-blue-500 checked:border-blue-500"
                        />
                        {/* Checkmark Icon */}
                        <svg
                            className="absolute left-1 top-1 h-4 w-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </label>
                    <h1 className="text-xl font-medium text-white">Limit Chaser</h1>
                </div>

                {/* "Filled or Cancel" toggle and input field */}
                <div className="flex items-center gap-24">
                    <p
                        className={`inter text-xs underline cursor-pointer w-60 ${filled ? "text-blue-400" : "text-[#C5C8D0]"}`}
                        onClick={() => setFilled(prev => !prev)}
                    >
                        Filled or Cancel
                    </p>
                    {/* Primary price input */}
                    <input
                        type="number"
                        disabled={!clicked}
                        readOnly={!clicked}
                        placeholder="Enter Price"
                        className={`inputs ${clicked ? "" : "bg-gray-800"}`}
                    />
                </div>

                {/* Long and Short Price Limit inputs */}
                <div>
                    <div className="flex gap-5">
                        {/* Long Limit */}
                        <div className="flex flex-col gap-1.5 w-full">
                            <h2 className="text-white font-medium">Long Price Limit</h2>
                            <input
                                type="number"
                                disabled={!clicked}
                                readOnly={!clicked}
                                placeholder="Enter Price"
                                className={`inputs ${clicked ? "" : "bg-gray-800"}`}
                            />
                        </div>

                        {/* Short Limit */}
                        <div className="flex flex-col gap-1.5 w-full">
                            <h2 className="text-white font-medium">Short Price Limit</h2>
                            <input
                                type="number"
                                disabled={!clicked}
                                readOnly={!clicked}
                                placeholder="Enter Price"
                                className={`inputs ${clicked ? "" : "bg-gray-800"}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Price Distance Section */}
                <div className="flex flex-col border-t border-b border-[#373A45] pt-5 pb-10">
                    <h1 className="text-white font-bold mb-2">Price Distance</h1>
                    <div className="flex gap-4 items-center">
                        
                        {/* Slider with custom styling */}
                        <div className="w-full relative">
                            <Slider.Root
                                value={value}
                                disabled={!clicked}
                                onValueChange={setValue}
                                min={0}
                                max={500}
                                step={1}
                                className="relative flex items-center w-full h-5"
                            >
                                <Slider.Track className={`relative grow rounded-full h-2 ${!clicked ? "bg-gray-700" : "bg-[#E5E5E5]"}`}>
                                    <Slider.Range className={`absolute h-full rounded-full ${!clicked ? "bg-gray-700" : "bg-yellow-400"}`} />
                                </Slider.Track>

                                {/* Custom Thumb SVG */}
                                <Slider.Thumb>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="outline-none" width="18" height="18" viewBox="0 0 16 16" fill="none">
                                        <path
                                            d="M8 15.4998C12.1421 15.4998 15.5 12.1419 15.5 7.99986C15.5 3.8577 12.1421 0.499847 8 0.499847C3.85788 0.499847 0.5 3.8577 0.5 7.99986C0.5 12.1419 3.85788 15.4998 8 15.4998Z"
                                            fill={!clicked ? "bg-gray-700" : "#F0B90B"}
                                        />
                                    </svg>
                                </Slider.Thumb>
                            </Slider.Root>

                            {/* Slider min/max labels */}
                            <div className="absolute left-0 right-0 top-full mt-1 flex justify-between text-xs text-white px-[2px]">
                                <p className="text-base font-bold">0%</p>
                                <p className="text-base font-bold">5%</p>
                            </div>
                        </div>

                        <p className="text-sm text-[rgba(255,255,255,0.70)]">or</p>

                        {/* Manual percentage input */}
                        <input
                            type="number"
                            disabled={!clicked}
                            readOnly={!clicked}
                            min="0"
                            max="5"
                            placeholder="Enter size"
                            value={value ? (value[0] / 100).toFixed(2) : ""}
                            onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") {
                                    setValue([0]);
                                } else {
                                    const num = Number(raw);
                                    if (!isNaN(num) && num >= 0 && num <= 5) {
                                        setValue([Math.round(num * 100)]);
                                    }
                                }
                            }}
                            className={`text-white max-w-[104px] min-w-0 w-full py-2 px-4 rounded-[4px] placeholder:text-[rgba(255,255,255,0.60)] border border-[rgba(255,255,255,0.25)] ${clicked ? "" : "bg-gray-800"}`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LimitChaser;
