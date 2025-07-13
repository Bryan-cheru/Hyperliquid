import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons'
import { useState, type SetStateAction } from 'react'

interface Props {
    setDeleteModal: React.Dispatch<SetStateAction<boolean>>
    setShow: React.Dispatch<SetStateAction<boolean>>
    handleRemoveCard: () => void;
    name: string;
    show: boolean;
}

const DeleteModal = ({ setDeleteModal, handleRemoveCard, name, setShow, show }: Props) => {

    const [cancel, setCancel] = useState<boolean>(false);

  return (
    <article className="bg-[#252930] p-4 rounded-md w-[1000px]">
        <div className='flex justify-between'>
              <div className="flex gap-4 items-center mb-20">
                  <div className='bg-[#4b5563] rounded-full p-2'>
                      <div className='bg-[#1f2937] rounded-full text-white px-4 py-2.5'>
                          <FontAwesomeIcon icon={faTrashAlt} />
                      </div>
                  </div>
                  <div>
                      <h1 className="text-white">Delete Account</h1>
                      <p className="text-[#c9cacb]">{name}</p>
                  </div>
              </div>
              <svg onClick={() => setDeleteModal(prev => !prev)} xmlns="http://www.w3.org/2000/svg" className="cursor-pointer transform -translate-y-15" width={12} fill="#545962" viewBox="0 0 384 512">
                  <path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z" />
              </svg>
        </div>
        <div className='flex justify-between items-center mb-3'>
            <div className='flex gap-2 items-center justify-center ml-20'>
                <input type="checkbox" checked={show} onChange={() => setShow(prev => !prev)} />
                <label className='text-white'>Don’t show again</label>
            </div>
            <div className='flex gap-3'>
                <button onClick={() => {
                    setDeleteModal(prev => !prev);
                    setShow(false);
                }} className='cursor-pointer text-white border py-2 px-4 rounded-lg'>Cancel</button>
                <button onClick={() => {
                      handleRemoveCard();
                      setDeleteModal(prev => !prev);
                }} className='cursor-pointer text-white bg-[#1f2937] border border-gray-700 py-2 px-4 rounded-lg'>Confirm</button>
            </div>
        </div>
    </article>
  )
}

export default DeleteModal