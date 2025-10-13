import PropTypes from "prop-types";
import { motion } from "motion/react";

const PromptStatistics = ({ value }) => {
  function countWords(text) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }

  function estimateTokensAdvanced(text) {
    const words = (text.match(/\b\w+\b/g) || []).length;
    const punctuation = (text.match(/[^\w\s]/g) || []).length;
    const whitespace = (text.match(/\s/g) || []).length;

    return Math.ceil(words * 1.3 + punctuation * 0.5 + whitespace * 0.1);
  }

  return (
    <motion.div className="flex flex-col items-center justify-center text-xl text-stone-400" layout>
      <p>{`Prompt length: ${value.length}`}</p>
      <p>{`Word count: ${countWords(value)}`}</p>
      <p>{`Estimated tokens: ${estimateTokensAdvanced(value)}`}</p>
    </motion.div>
  );
};

PromptStatistics.propTypes = {
  value: PropTypes.string.isRequired,
};

export default PromptStatistics;
