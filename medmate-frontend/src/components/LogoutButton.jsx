export default function LogoutButton() {
    const handleLogout = () => {
      localStorage.removeItem('access');
      localStorage.removeItem('user');
      window.location.href = '/login';
    };
  
    return (
      <button
        onClick={handleLogout}
        className="text-left hover:underline text-sm text-red-300"
      >
        Logout
      </button>
    );
  }
  