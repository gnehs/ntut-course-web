import { RouterProvider } from '@tanstack/react-router';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { router } from './router';
import { AppProvider } from './state/AppContext';
import './styles.css';

const root = document.getElementById('root');

if (!root) {
	throw new Error('Root element #root not found');
}

createRoot(root).render(
	<React.StrictMode>
		<AppProvider>
			<RouterProvider router={router} />
		</AppProvider>
	</React.StrictMode>,
);
