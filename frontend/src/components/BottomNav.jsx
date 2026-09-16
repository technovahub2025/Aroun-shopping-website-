import { NavLink, useNavigate } from "react-router-dom";
import { Home, Package, ShoppingCart, User } from "lucide-react";
import { useSelector } from "react-redux";
export default function BottomNav() {
  const user = useSelector(state => state.user.user);
  const navigate = useNavigate();
  const items = [{
    path: '/',
    icon: <Home size={21} />,
    label: 'Home'
  }, {
    path: '/product',
    icon: <Package size={21} />,
    label: 'Shop'
  }, {
    path: '/cart',
    icon: <ShoppingCart size={21} />,
    label: 'Bag'
  }, {
    path: '/profile',
    icon: <User size={21} />,
    label: 'Account'
  }];
  return <nav className="bottom-navigation" aria-label="Mobile navigation">{items.map(({
      path,
      icon,
      label
    }) => <NavLink key={path} to={path} end={path === '/'} onClick={event => {
      if (!user && ['/cart', '/profile'].includes(path)) {
        event.preventDefault();
        navigate('/', {
          state: {
            openAuth: true,
            authMode: 'login'
          }
        });
      }
    }}>{icon}<span>{label}</span></NavLink>)}</nav>;
}
