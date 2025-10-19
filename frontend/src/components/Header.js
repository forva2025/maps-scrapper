import { styled } from 'goober';
import { Link } from 'preact-router';

const HeaderContainer = styled('header')`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #1f2937;
  font-weight: 700;
  font-size: 1.25rem;
  
  &:hover {
    color: #2563eb;
  }
`;

const LogoIcon = styled('div')`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.125rem;
`;

const Nav = styled('nav')`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: #6b7280;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
  
  &:hover {
    color: #2563eb;
    background-color: #f3f4f6;
  }
  
  &.active {
    color: #2563eb;
    background-color: #eff6ff;
  }
`;

const MobileMenuButton = styled('button')`
  display: none;
  flex-direction: column;
  gap: 4px;
  padding: 0.5rem;
  border-radius: 0.375rem;
  background: none;
  border: none;
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: flex;
  }
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const MenuLine = styled('div')`
  width: 24px;
  height: 2px;
  background-color: #374151;
  border-radius: 1px;
  transition: all 0.3s;
  
  ${props => props.open && `
    &:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }
    
    &:nth-child(2) {
      opacity: 0;
    }
    
    &:nth-child(3) {
      transform: rotate(-45deg) translate(7px, -6px);
    }
  `}
`;

const StatusIndicator = styled('div')`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  
  ${props => {
    switch (props.status) {
      case 'online':
        return `
          background-color: #dcfce7;
          color: #166534;
        `;
      case 'offline':
        return `
          background-color: #fef3c7;
          color: #92400e;
        `;
      default:
        return `
          background-color: #f3f4f6;
          color: #374151;
        `;
    }
  }}
`;

const StatusDot = styled('div')`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  
  ${props => {
    switch (props.status) {
      case 'online':
        return 'background-color: #16a34a;';
      case 'offline':
        return 'background-color: #d97706;';
      default:
        return 'background-color: #6b7280;';
    }
  }}
`;

export function Header({ onMenuClick, sidebarOpen }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <HeaderContainer>
      <Logo href="/">
        <LogoIcon>🗺️</LogoIcon>
        Super MapScraper
      </Logo>

      <Nav>
        <NavLink href="/" activeClassName="active">Search</NavLink>
        <NavLink href="/history" activeClassName="active">History</NavLink>
        <NavLink href="/analytics" activeClassName="active">Analytics</NavLink>
      </Nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <StatusIndicator status={isOnline ? 'online' : 'offline'}>
          <StatusDot status={isOnline ? 'online' : 'offline'} />
          {isOnline ? 'Online' : 'Offline'}
        </StatusIndicator>

        <MobileMenuButton onClick={onMenuClick}>
          <MenuLine open={sidebarOpen} />
          <MenuLine open={sidebarOpen} />
          <MenuLine open={sidebarOpen} />
        </MobileMenuButton>
      </div>
    </HeaderContainer>
  );
}