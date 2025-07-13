const ButtonWrapper = () => {
  return (
    <article>
        <div className="flex flex-col items-center justify-center gap-5">
            <div className="flex gap-5 w-full">
                <button className="long !w-full">LONG</button>
                <button className="short !w-full">SHORT</button>
            </div>
            <div className="flex flex-col w-full items-center justify-center gap-3">
                <button className="positions">Close All Positions</button>
                <button className="orders">Cancel All Orders</button>
            </div>
        </div>
    </article>
  )
}

export default ButtonWrapper