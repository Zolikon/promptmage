import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MdFindReplace, MdClose } from 'react-icons/md';
import PropTypes from 'prop-types';

export const ReplaceMenu = ({ value, onReplace }) => {
    const [searchValue, setSearchValue] = useState('');
    const [replaceValue, setReplaceValue] = useState('');
    const [error, setError] = useState('');
    const searchInputRef = useRef(null);
    const popoverRef = useRef(null);

    const occurrences = useMemo(() => {
        if (!searchValue) return 0;
        const escapedSearch = searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        try {
            const regex = new RegExp(escapedSearch, 'g');
            const matches = value.match(regex);
            return matches ? matches.length : 0;
        } catch (e) {
            return 0;
        }
    }, [value, searchValue]);

    useEffect(() => {
        const popover = popoverRef.current;
        if (!popover) return;

        const handleToggle = (e) => {
            if (e.newState === 'open') {
                setTimeout(() => searchInputRef.current?.focus(), 100);
            } else if (e.newState === 'closed') {
                setSearchValue('');
                setReplaceValue('');
                setError('');
            }
        };

        popover.addEventListener('toggle', handleToggle);
        return () => popover.removeEventListener('toggle', handleToggle);
    }, []);

    const handleReplace = () => {
        if (!searchValue) {
            setError('Search text cannot be empty');
            return;
        }
        onReplace(searchValue, replaceValue);
        popoverRef.current.hidePopover();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleReplace();
        }
    };

    return (
        <>
            <button
                popovertarget="replace-popover"
                popovertargetaction="show"
                className="bg-stone-800 text-stone-400 p-2 rounded-md hover:bg-stone-700 hover:text-stone-200 transition cursor-pointer flex items-center justify-center gap-2 w-2/3"
                title="Replace text"
            >
                <MdFindReplace size={32} />
            </button>

            <div
                ref={popoverRef}
                id="replace-popover"
                popover="auto"
                className="bg-stone-900 border border-stone-700 rounded-lg p-6 m-auto backdrop:bg-black backdrop:opacity-50 relative w-[90vw] max-w-[400px]"
            >
                <button
                    className="px-4 py-2 text-stone-400 hover:text-stone-200 transition cursor-pointer absolute top-2 right-2"
                    popovertarget="replace-popover"
                    popovertargetaction="hide"
                >
                    <MdClose size={24} />
                </button>

                <h3 className="text-stone-200 text-lg font-medium mb-4">Replace Text</h3>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-stone-400 text-sm">Find</label>
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchValue}
                            onChange={(e) => {
                                setSearchValue(e.target.value);
                                setError('');
                            }}
                            onKeyDown={handleKeyDown}
                            className="bg-stone-800 text-stone-200 rounded p-2 border border-stone-700 focus:border-blue-500 outline-none"
                            placeholder="Text to replace..."
                        />
                        {error && <span className="text-red-500 text-xs">{error}</span>}
                    </div>

                    <div className="text-stone-500 text-sm">
                        Occurrences: <span className="text-stone-200 font-mono">{occurrences}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-stone-400 text-sm">Replace with</label>
                        <input
                            type="text"
                            value={replaceValue}
                            onChange={(e) => setReplaceValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="bg-stone-800 text-stone-200 rounded p-2 border border-stone-700 focus:border-blue-500 outline-none"
                            placeholder="Replacement text (optional)..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-2">
                        <button
                            popovertarget="replace-popover"
                            popovertargetaction="hide"
                            className="px-4 py-2 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReplace}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition cursor-pointer"
                        >
                            Replace
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

ReplaceMenu.propTypes = {
    value: PropTypes.string.isRequired,
    onReplace: PropTypes.func.isRequired,
};
