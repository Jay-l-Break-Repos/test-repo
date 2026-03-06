export const toast = {
  success: (message: string) => {
    // Create and append success message element
    const toastElement = document.createElement('div');
    toastElement.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg';
    toastElement.textContent = message;
    document.body.appendChild(toastElement);

    // Remove after 3 seconds
    setTimeout(() => {
      document.body.removeChild(toastElement);
    }, 3000);
  },

  error: (message: string) => {
    // Create and append error message element
    const toastElement = document.createElement('div');
    toastElement.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded shadow-lg';
    toastElement.textContent = message;
    document.body.appendChild(toastElement);

    // Remove after 3 seconds
    setTimeout(() => {
      document.body.removeChild(toastElement);
    }, 3000);
  },
};