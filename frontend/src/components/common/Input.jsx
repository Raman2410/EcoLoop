const Input = ({ type = "text", placeholder, onChange }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      onChange={onChange}
      className="w-full px-3 py-2 border rounded-md"
    />
  );
};

export default Input;
