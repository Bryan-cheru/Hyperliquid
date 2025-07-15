import { useEffect, useState } from "react";
import Account from "./Account";
import { AnimatePresence } from "framer-motion";
import DeleteModal from "./DeleteModal/DeleteModal";
import { useTrading } from "../../hooks/useTrading";
import './scrollbar.css';

// Define structure for each account
interface AccountInfo {
  title: string;
  num: number;
  status: string;
  pair: string;
  leverage: string;
  balance: string;
  pnl: string;
  selected: boolean;
  isMerged?: boolean;
  mergedIds?: number[];
}

// Props passed from parent component
interface Props {
  setAccNum: React.Dispatch<React.SetStateAction<number>>;
  setModal: React.Dispatch<React.SetStateAction<boolean>>;
}

// Main component for managing and displaying accounts
const AccountsWrapper = ({ setAccNum, setModal }: Props) => {
  // Modal and UI state management
  const [deleteModal, setDeleteModal] = useState(false);
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [accountNameInput, setAccountNameInput] = useState("");
  const [selectedMergedId, setSelectedMergedId] = useState<number | null>(null);
  const [selectedToDelete, setSelectedToDelete] = useState<number[]>([]);

  // Initial 10 account objects
  const [accounts, setAccounts] = useState<AccountInfo[]>(
    Array.from({ length: 10 }, (_, i) => ({
      title: "Account",
      num: i + 1,
      status: "ACTIVE",
      pair: i % 2 === 0 ? "BTC/USDT" : "ETH/USDT",
      leverage: i % 2 === 0 ? "20x Leverage" : "15x Leverage",
      balance: `$${(5000 + i * 100).toFixed(2)}`,
      pnl: `+$${(100 + i * 10).toFixed(2)}`,
      selected: false,
    }))
  );

  // Sync account count to parent
  useEffect(() => {
    setAccNum(accounts.length);
  }, [accounts]);

  // Toggle selection for individual account
  const handleToggleSelect = (id: number) => {
    setAccounts(prev =>
      prev.map(acc =>
        acc.num === id ? { ...acc, selected: !acc.selected } : acc
      )
    );
  };

  // Handle open delete confirmation modal
  const handleOpenModal = () => {
    const selected = accounts.filter(acc => acc.selected).map(acc => acc.num);

    // Case 1: Deleting a full merged account via dropdown
    if (selectedMergedId !== null && selected.length === 0) {
      const isMergedAccount = accounts.find(acc => acc.num === selectedMergedId && acc.isMerged);
      if (isMergedAccount) {
        setSelectedToDelete([selectedMergedId]);
        setDeleteModal(true);
        return;
      }
    }

    // Case 2: No selection made
    if (selected.length === 0) {
      alert("Please select at least one account to delete.");
      return;
    }

    // Case 3: Deleting selected individual accounts
    setSelectedToDelete(selected);
    setDeleteModal(true);
  };

  // Delete accounts from state
  const handleRemoveCard = () => {
    let updated = [...accounts];

    // Case: Entire merged account is being deleted
    if (selectedToDelete.length === 1) {
      const accToDelete = accounts.find(acc => acc.num === selectedToDelete[0]);
      if (accToDelete?.isMerged) {
        updated = updated.filter(acc => acc.num !== selectedToDelete[0]);
        setSelectedMergedId(null);
        setAccounts(updated);
        setSelectedToDelete([]);
        return;
      }
    }

    // Case: Delete selected accounts and update any merged parents
    updated = updated.filter(acc => !selectedToDelete.includes(acc.num));

    const updatedMerged = updated.map(acc => {
      if (acc.isMerged && acc.mergedIds) {
        const filteredMergedIds = acc.mergedIds.filter(id => !selectedToDelete.includes(id));
        
        // Remove merged account if it has no remaining children
        if (filteredMergedIds.length === 0) {
          return null;
        }

        // Update mergedIds if partial children removed
        if (filteredMergedIds.length !== acc.mergedIds.length) {
          return { ...acc, mergedIds: filteredMergedIds };
        }
      }
      return acc;
    }).filter(Boolean) as AccountInfo[];

    setAccounts(updatedMerged);
    setSelectedToDelete([]);
  };

  // Merge selected accounts into one new account
  const handleAdd = () => {
    const selectedAccounts = accounts.filter(acc => acc.selected);
    if (selectedAccounts.length < 2) {
      return alert("Select at least two accounts to merge");
    }

    if (accountNameInput.trim() === "") {
      return alert("Please enter a name for the new merged account.");
    }

    // Combine balances and PnLs
    const mergedBalance = selectedAccounts.reduce((sum, acc) => {
      const balance = parseFloat(acc.balance.replace(/[$,]/g, ""));
      return sum + balance;
    }, 0).toFixed(2);

    const mergedPnL = selectedAccounts.reduce((sum, acc) => {
      const pnl = parseFloat(acc.pnl.replace(/[+$,]/g, ""));
      return sum + pnl;
    }, 0).toFixed(2);

    // Create merged account with new ID
    const lastNum = Math.max(...accounts.map(acc => acc.num), 0);
    const mergedAccount: AccountInfo = {
      title: accountNameInput.trim(),
      num: lastNum + 1,
      status: "ACTIVE",
      pair: selectedAccounts[0].pair,
      leverage: "15x Leverage",
      balance: `$${mergedBalance}`,
      pnl: `+$${mergedPnL}`,
      selected: false,
      isMerged: true,
      mergedIds: selectedAccounts.map(acc => acc.num),
    };

    // Append merged account and deselect others
    setAccounts(prev => [
      ...prev.map(acc => ({ ...acc, selected: false })),
      mergedAccount,
    ]);

    setAccountNameInput("");
    setSelectedMergedId(mergedAccount.num);
  };

  // Determines which accounts should be displayed in the grid
  const getAccountsToDisplay = () => {
    if (selectedMergedId !== null) {
      const merged = accounts.find(acc => acc.num === selectedMergedId && acc.isMerged);
      return accounts.filter(acc => merged?.mergedIds?.includes(acc.num));
    }
    return accounts.filter(acc => !acc.isMerged);
  };

  return (
    <section className="relative w-[75vw] max-w-[750px] h-[85vh] bg-[#12131a] rounded-xl p-4 overflow-y-auto inter shadow-2xl scrollbar-thin-dark">
      {/* Close button for modal */}
      <button
        onClick={() => setModal(false)}
        className="text-gray-400 hover:text-white text-xl absolute top-4 right-4"
        aria-label="Close"
      >
        &times;
      </button>

      {/* Delete modal with conditional text */}
      {deleteModal && (
        <div className="fixed w-full inset-0 flex items-center justify-center z-50 backdrop-blur-[1.8px] shadow-lg">
          <DeleteModal
            setShow={setShow}
            show={show}
            name={
              selectedToDelete.length === 1 &&
              accounts.find(acc => acc.num === selectedToDelete[0])?.isMerged
                ? "Do you want to delete this merged account?"
                : `Do you want to delete ${selectedToDelete.length} account(s)?`
            }
            handleRemoveCard={handleRemoveCard}
            setDeleteModal={setDeleteModal}
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-white text-lg mb-8">Account Management</h1>
        </div>

        {/* Top control panel with input and actions */}
        <div className="grid grid-cols-3 gap-3 mb-5 items-start">
          <input
            type="text"
            placeholder="Enter Account Name"
            value={accountNameInput}
            onChange={(e) => setAccountNameInput(e.target.value)}
            className="h-10 w-[210px] bg-[#1a1b24] text-white border border-gray-800 rounded-md py-2 pl-4 pr-4 placeholder:text-white col-span-1 text-sm"
          />

          {/* Exchange list dropdown - placeholder */}
          <div className="flex flex-col items-start justify-start col-span-1 mt-[1px]">
            <select className="h-10 w-40 bg-[#1a1b24] text-white border border-gray-800 rounded-md px-2 text-sm">
              <option>Exchange List</option>
              <option>Binance</option>
              <option>Bybit</option>
              <option>HyperLiquid</option>
            </select>
          </div>

          {/* Merge & delete buttons + merged account selector */}
          <div className="flex flex-col gap-2 items-end col-span-1">
            <div className="flex gap-2">
              <button onClick={handleAdd} className="h-10 w-[120px] bg-[#16a34a] text-white rounded-[4px] text-sm">
                Create Account
              </button>
              <button onClick={handleOpenModal} className="h-10 w-[100px] bg-[#dc2626] text-white rounded-[4px] text-sm">
                DELETE
              </button>
            </div>
            <select
              value={selectedMergedId || ""}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedMergedId(val ? parseInt(val) : null);
              }}
              className="h-10 w-52 bg-[#1a1b24] text-white border border-gray-800 rounded-md px-3 text-sm"
            >
              <option value="">Account List</option>
              {accounts.filter(acc => acc.isMerged).map(acc => (
                <option key={acc.num} value={acc.num}>{acc.title}</option>
              ))}
            </select>
          </div>
        </div>

        <hr className="border border-gray-800" />
      </div>

      {/* Render individual or merged accounts */}
      <div className="grid grid-cols-2 items-center gap-7 mt-5">
        <AnimatePresence>
          {getAccountsToDisplay().map((acc) => (
            <Account
              key={acc.num}
              acc={acc}
              id={acc.num}
              getId={handleToggleSelect}
              getName={setName}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default AccountsWrapper;
