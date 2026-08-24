export default function ConnectInstagram() {
  return (
    <button
      onClick={() => {
        window.location.href = "/connect-instagram";
      }}
      className="bg-gradient-to-r from-pink-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold"
    >
      Connect Instagram
    </button>
  );
}