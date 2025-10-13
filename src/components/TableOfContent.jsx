import PropTypes from "prop-types";

const HEADER_COLOR_MAP = {
  1: "bg-red-600",
  2: "bg-orange-600",
  3: "bg-yellow-600",
  4: "bg-green-600",
  5: "bg-blue-600",
  6: "bg-purple-600",
};

const TableOfContents = ({ headerMap }) => {
  return (
    <div className="flex flex-col h-full">
      <p className="text-stone-300 font-bold text-lg mb-2">Table of Contents</p>
      <div className="flex flex-col overflow-y-auto flex-grow">
        {headerMap.length === 0 && <p className="text-stone-400 text-sm italic">No markdown headers found</p>}
        {headerMap.map((header, index) => (
          <a
            key={index}
            style={{
              marginLeft: `${header.level * 10}px`,
            }}
            className={`text-stone-200 text-sm w-[80%] cursor-pointer p-2 mt-1 ${
              HEADER_COLOR_MAP[header.level]
            } hover:underline rounded-md`}
            href={`#${header.text.replace(/\s+/g, "-").replace(":", "").toLowerCase()}`}
          >
            {`${header.level}. ${header.text.length > 20 ? header.text.slice(0, 35) + "..." : header.text}`}
          </a>
        ))}
      </div>
    </div>
  );
};

TableOfContents.propTypes = {
  headerMap: PropTypes.arrayOf(
    PropTypes.shape({
      level: PropTypes.number.isRequired,
      text: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default TableOfContents;
