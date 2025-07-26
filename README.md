# Working Hours Tracker

A modern, responsive web application for tracking work hours with PDF export functionality.

## Features

- ✅ Track work hours with date, start time, and end time
- ✅ Automatic calculation of total working hours
- ✅ Edit and delete entries
- ✅ Export data to PDF for specific periods
- ✅ Responsive design for all devices
- ✅ Data persistence using localStorage
- ✅ Modern UI with pastel color scheme

## Installation & Setup

### Prerequisites
- Node.js (version 14 or higher)
- npm

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Hours-Tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build CSS for development (with watch mode)**
   ```bash
   npm run dev
   ```

4. **Open the application**
   - Open `index.html` in your browser
   - Or use a local server: `python -m http.server` or `npx serve .`

### Production Build

1. **Build optimized CSS**
   ```bash
   npm run build:prod
   ```

2. **Deploy the files**
   - Upload all files to your web server
   - Ensure `dist/output.css` is accessible
   - The application is now production-ready

## File Structure

```
Hours-Tracker/
├── index.html          # Main HTML file
├── script.js           # JavaScript functionality
├── src/
│   └── input.css      # Tailwind CSS input file
├── dist/
│   └── output.css     # Compiled CSS (generated)
├── tailwind.config.js # Tailwind configuration
├── package.json       # Project dependencies
└── README.md         # This file
```

## Usage

1. **Add Work Entry**
   - Enter date, start time, and end time
   - Click "Add Entry" to save

2. **Edit Entry**
   - Click "Edit" button on any entry
   - Modify the values and click "Update Entry"

3. **Delete Entry**
   - Click "Delete" button on any entry
   - Confirm deletion in the popup

4. **Export PDF**
   - Select export period using the dropdowns
   - Click "Export PDF" to download report
   - Maximum 31 days per export

5. **View Entries**
   - Click "Show Entries" to toggle the table view

## Technical Details

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Tailwind CSS (production build)
- **PDF Generation**: jsPDF with AutoTable plugin
- **Data Storage**: Browser localStorage
- **Responsive**: Mobile-first design with breakpoints

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Production Notes

- ✅ Uses compiled Tailwind CSS (not CDN)
- ✅ Minified CSS for production
- ✅ Optimized for performance
- ✅ No external CSS dependencies
- ✅ Works offline (except PDF generation)

## Development Commands

```bash
# Development with watch mode
npm run dev

# Production build
npm run build:prod

# One-time build
npm run build
```

## License

ISC License 