import WorkspaceShell from '../components/WorkspaceShell';

const userNavItems = [
  { label: 'Upload', path: '/user/upload' },
  { label: 'Profile & QR', path: '/user/profile' },
  { label: 'Notifications', path: '/user/notifications' },
];

const notifications = [
  'TechCorp accepted your proof package and logged the audit hash.',
  'DataSys rejected the submitted proof because the degree rule did not match.',
  'Innovate Solutions is waiting for your QR submission.',
];

const UserNotifications = () => {
  return (
    <WorkspaceShell
      role="USER"
      handle="ayush@123"
      sectionLabel="USER SIDE"
      pageTitle="Notifications"
      pageDescription="Track proof requests and verification outcomes without exposing raw user records."
      navItems={userNavItems}
      activePath="/user/notifications"
    >
      <div style={{ display: 'grid', gap: '0.85rem' }}>
        {notifications.map((item) => (
          <div key={item} className="workspace-inline-card">
            {item}
          </div>
        ))}
      </div>
    </WorkspaceShell>
  );
};

export default UserNotifications;
