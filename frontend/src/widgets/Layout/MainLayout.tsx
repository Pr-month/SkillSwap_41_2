import { Header } from '@/widgets/Header/Header';
import { Footer } from '@/widgets/Footer/Footer';
import { Outlet } from 'react-router-dom';
import styles from './MainLayout.module.css';

export const MainLayout = () => {
  return (
    <>
      <Header />
      <main className={styles.content}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};
