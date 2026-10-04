import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export default function Layout() {
  const token = localStorage.getItem('token');
  const { user, logout } = useAuth();
  const { pathname } = useLocation();


  let navItems;


  if (user?.role === 'SUPER_ADMIN') {
    navItems = [
      { to: '/', label: '📊 Dashboard' },
      { to: '/patients', label: '👤 Patients' },
      { to: '/departments', label: '🏢 Departments' },
      { to: '/doctors', label: '👨‍⚕️ Doctors' },
      { to: '/tests', label: '🧪 Tests & Categories' },
      { to: '/test-orders', label: '🧾 Test Orders' },
      { to: '/result-entry', label: '🔬 Result Entry' },
      { to: '/permissions', label: '🔐 Reports & Permission' },
      { to: '/due', label: '💸 Due' },
      { to: '/operation-categories', label: '🏥 Operation Categories' },
      { to: '/admit-patients', label: '🛏️ Admitted Patients' },
      { to: '/users', label: '👥 Users' },
    ];
  } else if (user?.role === 'ADMIN') {
    navItems = [
      { to: '/', label: '📊 Dashboard' },
      { to: '/patients', label: '👤 Patients' },
      { to: '/departments', label: '🏢 Departments' },
      { to: '/doctors', label: '👨‍⚕️ Doctors' },
      { to: '/tests', label: '🧪 Tests & Categories' },
      { to: '/test-orders', label: '🧾 Test Orders' },
      { to: '/result-entry', label: '🔬 Result Entry' },
      { to: '/permissions', label: '🔐 Reports & Permission' },
      { to: '/due', label: '💸 Due' },
      { to: '/operation-categories', label: '🏥 Operation Categories' },
      { to: '/admit-patients', label: '🛏️ Admitted Patients' },
      { to: '/users', label: '👥 Users' },
    ];
  } else if (user?.role === 'RECEPTIONIST') {
    navItems = [
      { to: '/', label: '📊 Dashboard' },
      { to: '/patients', label: '👤 Patients' },
      { to: '/departments', label: '🏢 Departments' },
      { to: '/doctors', label: '👨‍⚕️ Doctors' },
      { to: '/test-orders', label: '🧾 Test Orders' },
    ];
  } else {
    navItems = [
      { to: '/', label: '📊 Dashboard' },
      { to: '/tests', label: '🧪 Tests & Categories' },
      { to: '/result-entry', label: '🔬 Result Entry' },
      { to: '/urine', label: '🧪 Urine Reports' },
      { to: '/cbc', label: '🩸 CBC Reports' },
    ]

  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-slate-900 text-white p-4">
        <div className="mb-8">
          <h1 className="text-lg font-bold">BOISHAKHI</h1>
          <p className="text-xs text-slate-400">Hospital Management</p>
        </div>
        <nav className="space-y-1">
          {navItems.map((n) => {
            return (
              <Link key={n.to} to={n.to}
                className={`block px-3 py-2 rounded text-sm ${pathname === n.to ? 'bg-blue-600' : 'hover:bg-slate-700'
                  }`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="bg-white shadow px-6 py-3 flex justify-between items-center">
          <div />
          <div className="flex items-center gap-3">
            <span className="text-sm">
              {user?.name} <span className="text-xs text-slate-500">({user?.role})</span>
            </span>
            <button onClick={logout} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Logout</button>
          </div>
        </header>
        <main className="p-6"><Outlet /></main>
      </div>
    </div>
  );
}