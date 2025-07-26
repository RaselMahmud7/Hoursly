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

