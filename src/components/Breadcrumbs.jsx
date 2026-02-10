import React from 'react';
import PropTypes from 'prop-types';
import { MdChevronRight, MdHome } from 'react-icons/md';

const Breadcrumbs = ({ path, onNavigate }) => {
    return (
        <div className="flex items-center gap-1 text-sm text-stone-400 mb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <button
                onClick={() => onNavigate(-1)}
                className="flex items-center hover:text-stone-200 transition-colors cursor-pointer"
                title="Full Prompt"
            >
                <MdHome size={16} />
                <span className="ml-1">Prompt</span>
            </button>

            {path.map((item, index) => (
                <React.Fragment key={index}>
                    <MdChevronRight className="text-stone-600 shrink-0" />
                    <button
                        onClick={() => onNavigate(index)}
                        className={`hover:text-stone-200 transition-colors cursor-pointer ${index === path.length - 1 ? 'font-bold text-stone-200' : ''
                            }`}
                    >
                        {typeof item === 'string' ? item : item.name}
                    </button>
                </React.Fragment>
            ))}
        </div>
    );
};

Breadcrumbs.propTypes = {
    path: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({ name: PropTypes.string, id: PropTypes.string })
    ])).isRequired,
    onNavigate: PropTypes.func.isRequired,
};

export default Breadcrumbs;
