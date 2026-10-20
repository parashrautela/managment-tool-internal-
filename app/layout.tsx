import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Flowboard — Make room for great work', description:'Your projects, people, and priorities. One thoughtfully organized workspace.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) {return <html lang="en"><body>{children}</body></html>;}
