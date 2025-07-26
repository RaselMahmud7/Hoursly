// Filename: script.js
const { jsPDF } = window.jspdf;

// Test the calculation functions
function testCalculation() {
  console.log('=== TESTING CALCULATION FUNCTIONS ===');
  
  // Test normal same-day work
  const testStart1 = '09:30';
  const testEnd1 = '17:45';
  
  const startMins1 = parseTime(testStart1);
  const endMins1 = parseTime(testEnd1);
  const totalMins1 = endMins1 - startMins1;
  
  console.log(`Test 1 (Same Day): ${testStart1} to ${testEnd1}`);
  console.log(`Result: ${formatHours(totalMins1)}`);
  console.log('Expected: 8:15 (8 hours 15 minutes)');
  
  // Test overnight work
  const testStart2 = '11:00';
  const testEnd2 = '10:00';
  
  const startMins2 = parseTime(testStart2);
  const endMins2 = parseTime(testEnd2);
  const totalMins2 = (endMins2 + 1440) - startMins2; // Add 24 hours for overnight
  
  console.log(`Test 2 (Overnight): ${testStart2} to ${testEnd2} (next day)`);
  console.log(`Result: ${formatHours(totalMins2)}`);
  console.log('Expected: 23:00 (23 hours)');
  
  console.log('=====================================');
}

let entries = [];
let editIndex = null;
let isTableVisible = false;
let payPeriodDay = 20; // Default pay period start day

function getStorageKey() {
  return 'workEntries';
}

window.onload = () => {
  console.log('Hoursly App - Window loaded, initializing...');
  
  // Get all required DOM elements
  const form = document.getElementById('entryForm');
  const dateInput = document.getElementById('dateInput');
  const startTimeInput = document.getElementById('startTimeInput');
  const endTimeInput = document.getElementById('endTimeInput');
  const entriesTable = document.getElementById('entriesTable');
  const entriesTableBody = document.getElementById('entriesTableBody');
  const summaryContainer = document.getElementById('summaryContainer');
  const appSection = document.getElementById('appSection');
  const toggleTableBtn = document.getElementById('toggleTableBtn');
  const tableContainer = document.getElementById('tableContainer');
  
  // Debug: Log element status
  console.log('Form element:', form ? 'Found' : 'Missing');
  console.log('Date input:', dateInput ? 'Found' : 'Missing');
  console.log('Start time input:', startTimeInput ? 'Found' : 'Missing');
  console.log('End time input:', endTimeInput ? 'Found' : 'Missing');
  console.log('Toggle table btn:', toggleTableBtn ? 'Found' : 'Missing');
  
  // Test the calculation functions
  testCalculation();
  
  // Update footer year
  const currentYearElement = document.getElementById('currentYear');
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }
  
  // Check if all required elements are present
  const requiredElements = [
    'entryForm', 'dateInput', 'startTimeInput', 'endTimeInput', 
    'toggleTableBtn', 'entriesModal', 'modalEntriesTable', 'closeModalBtn',
    'printPdfBtn', 'payPeriodDay', 'editPayPeriodBtn'
  ];
  
  const missingElements = requiredElements.filter(id => !document.getElementById(id));
  if (missingElements.length > 0) {
    console.error('Missing elements:', missingElements);
  } else {
    console.log('All required elements found');
  }
  
  // Initialize pay period selector
  initializePayPeriodSelector();
  
  // Initialize period selector
  initializePeriodSelector();
  
  const stored = localStorage.getItem(getStorageKey());
  entries = stored ? JSON.parse(stored) : [];
  console.log('Loaded entries from localStorage:', entries.length);
  updateTable();
  updateSummaryAndHeader();
  
  // Modal functionality
  const entriesModal = document.getElementById('entriesModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const printPdfBtn = document.getElementById('printPdfBtn');
  const modalEntriesTable = document.getElementById('modalEntriesTable');

  // Show modal instead of table
  toggleTableBtn.addEventListener('click', () => {
    // Show current pay period entries by default
    const { startDate, endDate } = calculatePayPeriodRange();
    updateModalTable(startDate, endDate);
    entriesModal.classList.remove('hidden');
    document.getElementById('backdropOverlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Initialize period selector when modal opens (in case elements weren't available before)
    setTimeout(() => {
      initializePeriodSelector();
    }, 100);
  });

  // Close modal
  closeModalBtn.addEventListener('click', () => {
    entriesModal.classList.add('hidden');
    document.getElementById('backdropOverlay').classList.add('hidden');
    document.body.style.overflow = 'auto'; // Restore scrolling
  });

  // Close modal when clicking outside - REMOVED (only X button can close)
  // entriesModal.addEventListener('click', (e) => {
  //   if (e.target === entriesModal) {
  //     entriesModal.classList.add('hidden');
  //     document.getElementById('backdropOverlay').classList.add('hidden');
  //     document.body.style.overflow = 'auto';
  //   }
  // });

  // Close modal with Escape key - REMOVED (only X button can close)
  // document.addEventListener('keydown', (e) => {
  //   if (e.key === 'Escape' && !entriesModal.classList.contains('hidden')) {
  //     entriesModal.classList.add('hidden');
  //     document.getElementById('backdropOverlay').classList.add('hidden');
  //     document.body.style.overflow = 'auto';
  //   }
  // });

  // Update modal table
  function updateModalTable(startDate = null, endDate = null) {
  console.log('updateModalTable called with:', startDate, endDate);
  
  // Get the modal table element fresh each time
  const modalEntriesTable = document.getElementById('modalEntriesTable');
  console.log('Modal table element found:', !!modalEntriesTable);
  console.log('Modal table element:', modalEntriesTable);
  
  if (!modalEntriesTable) {
    console.error('Modal table element not found!');
    return;
  }
  
  let filteredEntries = [...entries];
  
  // Filter by date range if provided
  if (startDate && endDate) {
    filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });
    console.log('Filtered entries:', filteredEntries.length, 'out of', entries.length);
  } else {
    console.log('Showing all entries:', entries.length);
  }
  
  const sortedEntries = filteredEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (sortedEntries.length === 0) {
    let message;
    if (startDate && endDate) {
      // Format dates for display
      const startDateFormatted = startDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const endDateFormatted = endDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      message = `<p class="text-center text-gray-500 text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl py-8">No entries found for this period (${startDateFormatted} - ${endDateFormatted})</p>`;
    } else {
      message = '<p class="text-center text-gray-500 text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl py-8">No entries available</p>';
    }
    modalEntriesTable.innerHTML = message;
    console.log('Set empty message:', message);
    return;
  }

    let tableHTML = `
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white border border-gray-200 rounded-xl shadow-lg">
          <thead>
            <tr class="bg-gradient-to-r from-[#FFEAEA] to-[#F5CBCB] text-[#374151]">
              <th class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-semibold border-b border-gray-200 whitespace-nowrap">Date</th>
              <th class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-semibold border-b border-gray-200 whitespace-nowrap">Start</th>
              <th class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-semibold border-b border-gray-200 whitespace-nowrap">End</th>
              <th class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-semibold border-b border-gray-200 whitespace-nowrap">Hours</th>
              <th class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-semibold border-b border-gray-200 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    sortedEntries.forEach((entry, index) => {
      const rowClass = index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100';
      
      tableHTML += `
        <tr class="${rowClass} transition-colors duration-200">
          <td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl border-b border-gray-200 whitespace-nowrap">${entry.date}</td>
          <td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl border-b border-gray-200 whitespace-nowrap">${formatTimeAMPM(entry.startTime)}</td>
          <td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl border-b border-gray-200 whitespace-nowrap">${formatTimeAMPM(entry.endTime)}${entry.isOvernight ? ' <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">+1</span>' : ''}</td>
          <td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl border-b border-gray-200 font-medium text-[#A6D6D6] whitespace-nowrap">${formatHours(entry.totalMinutes)}</td>
          <td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl border-b border-gray-200 whitespace-nowrap">
            <button class="table-action-edit bg-[#8DD3B6] hover:bg-[#7BC4A5] text-white font-bold py-1 px-2 rounded transition mr-1 text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-xl shadow-sm hover:shadow-md" data-edit-index="${entries.indexOf(entry)}" aria-label="Edit Entry">Edit</button>
            <button class="table-action-delete bg-[#FFB3BA] hover:bg-[#FF9AA2] text-white font-bold py-1 px-2 rounded transition text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-xl shadow-sm hover:shadow-md" data-index="${entries.indexOf(entry)}" aria-label="Delete Entry">Delete</button>
          </td>
        </tr>
      `;
    });

    tableHTML += '</tbody></table></div>';
    console.log('Generated table HTML length:', tableHTML.length);
    console.log('Current modal table innerHTML before update:', modalEntriesTable.innerHTML.substring(0, 100) + '...');
    
    // Force update the table content
    modalEntriesTable.innerHTML = '';
    modalEntriesTable.innerHTML = tableHTML;
    
    console.log('Table HTML set successfully');
    console.log('New modal table innerHTML after update:', modalEntriesTable.innerHTML.substring(0, 100) + '...');

    // Only add event listeners if there are entries
    if (sortedEntries.length > 0) {
      // Add event listeners to modal table buttons
      modalEntriesTable.querySelectorAll('.table-action-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const editIndex = parseInt(e.target.dataset.editIndex);
          editEntry(editIndex);
          entriesModal.classList.add('hidden');
          document.getElementById('backdropOverlay').classList.add('hidden');
          document.body.style.overflow = 'auto';
        });
      });

      modalEntriesTable.querySelectorAll('.table-action-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.dataset.index);
          console.log('=== MODAL DELETE BUTTON CLICK ===');
          console.log(`Delete button clicked for index: ${index}`);
          console.log(`Total entries: ${entries.length}`);
          console.log(`Entry at index:`, entries[index]);
          console.log('==================================');
          
          showDeleteConfirmation(entries[index], index);
          // Don't close the modal - let the delete confirmation handle it
        });
      });
    }
  }



  // Print as PDF
  printPdfBtn.addEventListener('click', () => {
    // Get the currently visible entries from the modal
    const periodStartDate = document.getElementById('periodStartDate');
    const periodEndDate = document.getElementById('periodEndDate');
    
    let entriesToExport = [...entries];
    
    // If period dates are set, filter entries to match what's currently visible
    if (periodStartDate.value && periodEndDate.value) {
      const startDate = new Date(periodStartDate.value);
      const endDate = new Date(periodEndDate.value);
      endDate.setHours(23, 59, 59);
      
      entriesToExport = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      });
    }
    
    const sortedEntries = entriesToExport.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedEntries.length === 0) {
      showValidationMessage('No entries to export for the selected period');
      return;
    }

    const doc = new jsPDF();
    const currentYear = new Date().getFullYear();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Load icon image
    const img = new window.Image();
    img.src = 'images/hoursly.png';
    img.onload = function() {
      // Create a canvas to convert image to base64
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imgData = canvas.toDataURL('image/png');

      // Add watermark (large, centered, faint)
      const wmWidth = pageWidth * 0.6;
      const aspect = img.width / img.height;
      const wmHeight = wmWidth / aspect;
      const wmX = (pageWidth - wmWidth) / 2;
      const wmY = (pageHeight - wmHeight) / 2;
      
      doc.setGState && doc.setGState(new doc.GState({opacity: 0.1})); // jsPDF 2.x+
      doc.addImage(imgData, 'PNG', wmX, wmY, wmWidth, wmHeight, undefined, 'FAST');
      doc.setGState && doc.setGState(new doc.GState({opacity: 1}));

      // Header: App name with icon (centered, no background)
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(55, 65, 81); // #374151
      
      // Add icon to header
      const iconSize = 12;
      const iconX = (pageWidth / 2) - 25; // Position icon to the left of text
      const iconY = 8;
      doc.addImage(imgData, 'PNG', iconX, iconY, iconSize, iconSize, undefined, 'FAST');
      
      // Add text
      doc.setTextColor(166, 214, 214); // #A6D6D6 - same as icon
      doc.text('Hoursly', pageWidth / 2, 15, { align: 'center' });

      // Add horizontal line under header
      doc.setDrawColor(166, 214, 214); // #A6D6D6
      doc.setLineWidth(0.5);
      doc.line(20, 20, pageWidth - 20, 20);

      // Add total hours summary for payslip period (top left)
      const summaryY = 25;
      
      // Calculate total hours from the entries being exported
      const totalMinutes = sortedEntries.reduce((sum, entry) => sum + entry.totalMinutes, 0);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      // Add summary text with "Total Working Hours: Hours: Minutes" format (left aligned)
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(55, 65, 81); // #374151
      
      // Generate period text based on what's being exported
      let periodText;
      if (periodStartDate.value && periodEndDate.value) {
        // Format the export period for display
        const formatDateForDisplay = (date) => {
          const day = date.getDate();
          const month = getMonthName(date.getMonth());
          return `${day}${getDaySuffix(day)} ${month}`;
        };
        
        const startDate = new Date(periodStartDate.value);
        const endDate = new Date(periodEndDate.value);
        periodText = `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`;
      } else {
        // If no period selected, show "All Entries"
        periodText = 'All Entries';
      }
      const summaryText = `Total Hours: ${hours} Hours: ${minutes.toString().padStart(2, '0')} Minutes`;
      doc.text(summaryText, 20, summaryY);
      

      
      // Add pay period information above the table
      const payPeriodY = summaryY + 15;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(55, 65, 81); // #374151
      doc.text(`Pay Period: ${periodText}`, pageWidth / 2, payPeriodY, { align: 'center' });
      
      // Add generation date (right aligned)
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(107, 114, 128); // #6B7280
      const dateText = `Generated on: ${new Date().toLocaleDateString()}`;
      doc.text(dateText, pageWidth - 20, summaryY, { align: 'right' });

      // Table
      const tableData = sortedEntries.map(entry => [
        entry.date,
        formatTimeAMPM(entry.startTime),
        formatTimeAMPM(entry.endTime) + (entry.isOvernight ? ' +1' : ''),
        formatHours(entry.totalMinutes)
      ]);

      doc.autoTable({
        head: [['Date', 'Start Time', 'End Time', 'Hours']],
        body: tableData,
        startY: 50,
        styles: {
          fontSize: 10,
          cellPadding: 2,
          lineColor: [229, 231, 235], // Light gray borders
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [166, 214, 214], // #A6D6D6
          textColor: [55, 65, 81],
          fontStyle: 'bold',
          lineColor: [166, 214, 214] // Match header color for borders
        },
        alternateRowStyles: {
          fillColor: [227, 246, 255] // #E3F6FF - soft light blue pastel
        }
      });



      // Add horizontal line above footer
      doc.setDrawColor(166, 214, 214); // #A6D6D6
      doc.setLineWidth(0.5);
      doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);

      // Footer: Copyright and developer (centered, no background)
      doc.setFontSize(6);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(55, 65, 81); // #374151
      doc.text(`© ${currentYear} Hoursly. All Rights Reserved.`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.setFontSize(5);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(107, 114, 128); // #6B7280
      doc.text('Developed By M Rasel Mahmud', pageWidth / 2, pageHeight - 6, { align: 'center' });

      // Save PDF
      doc.save(`hoursly-entries-${new Date().toISOString().split('T')[0]}.pdf`);
    };
  });

  // Remove old table toggle functionality
  // toggleTableBtn.addEventListener('click', () => {
  //   const tableContainer = document.getElementById('tableContainer');
  //   if (tableContainer.classList.contains('hidden')) {
  //     tableContainer.classList.remove('hidden');
  //     toggleTableBtn.textContent = 'Hide Entries';
  //   } else {
  //     tableContainer.classList.add('hidden');
  //     toggleTableBtn.textContent = 'Show Entries';
  //   }
  //   updateTable();
  // });



  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const date = dateInput.value;
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;
    const isOvernight = document.getElementById('overnightCheckbox')?.checked || false;
    
    if (!date || !startTime || !endTime) {
      showValidationMessage('Please fill in all fields');
      return;
    }
    
    // For overnight work, end time can be less than start time
    if (!isOvernight && startTime >= endTime) {
      showValidationMessage('End time must be after start time (or check overnight work)');
      return;
    }
    
    // Check for time conflicts with existing entries on the same day
    const timeConflict = checkTimeConflict(date, startTime, endTime, isOvernight, editIndex);
    if (timeConflict) {
      showValidationMessage(timeConflict);
      return;
    }
    
    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);
    let totalMinutes;
    
    if (isOvernight) {
      // For overnight work: end time is next day, so add 24 hours (1440 minutes)
      totalMinutes = (endMinutes + 1440) - startMinutes;
    } else {
      // Normal same-day work
      totalMinutes = endMinutes - startMinutes;
    }
    
    // Debug: Show the calculation in detail
    console.log('=== HOURS CALCULATION DEBUG ===');
    console.log(`Start Time: ${startTime}`);
    console.log(`End Time: ${endTime}`);
    console.log(`Overnight: ${isOvernight}`);
    console.log(`Start Minutes: ${startMinutes} (${Math.floor(startMinutes/60)}h ${startMinutes%60}m)`);
    console.log(`End Minutes: ${endMinutes} (${Math.floor(endMinutes/60)}h ${endMinutes%60}m)`);
    if (isOvernight) {
      console.log(`End Minutes (with 24h): ${endMinutes + 1440} (${Math.floor((endMinutes + 1440)/60)}h ${(endMinutes + 1440)%60}m)`);
    }
    console.log(`Total Minutes: ${totalMinutes}`);
    console.log(`Formatted Result: ${formatHours(totalMinutes)}`);
    console.log('===============================');
    
    if (editIndex !== null) {
      // Edit existing entry
      entries[editIndex] = { date, startTime, endTime, totalMinutes, isOvernight };
      editIndex = null;
      showCancelEditBtn();
      showSuccessMessage(`Entry updated successfully! Hours: ${formatHours(totalMinutes)}`);
    } else {
      // Add new entry
      entries.push({ date, startTime, endTime, totalMinutes, isOvernight });
      showSuccessMessage(`Entry added successfully! Hours: ${formatHours(totalMinutes)}`);
    }
    
    saveEntries();
    updateTable();
    updateSummaryAndHeader();
    
    // Clear form completely without triggering validation
    setTimeout(() => {
      // Disable form validation
      form.setAttribute('novalidate', '');
      
      // Clear all inputs
      dateInput.value = '';
      startTimeInput.value = '';
      endTimeInput.value = '';
      
      // Uncheck overnight checkbox
      const overnightCheckbox = document.getElementById('overnightCheckbox');
      if (overnightCheckbox) {
        overnightCheckbox.checked = false;
      }
      
      // Clear all validation states
      dateInput.setCustomValidity('');
      startTimeInput.setCustomValidity('');
      endTimeInput.setCustomValidity('');
      
      // Remove any validation UI
      dateInput.classList.remove('invalid');
      startTimeInput.classList.remove('invalid');
      endTimeInput.classList.remove('invalid');
      
      // Focus on date input
      dateInput.focus();
      
      // Re-enable validation after longer delay
      setTimeout(() => {
        form.removeAttribute('novalidate');
      }, 500);
    }, 200);
  });

  // Add event listeners for edit and delete buttons in the main table
  entriesTableBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('table-action-edit')) {
      const editIndex = parseInt(e.target.dataset.editIndex);
      editEntry(editIndex);
    } else if (e.target.classList.contains('table-action-delete')) {
      const index = parseInt(e.target.dataset.index);
      showDeleteConfirmation(entries[index], index);
    }
  });
};

// Edit entry function
function editEntry(index) {
  const entry = entries[index];
  dateInput.value = entry.date;
  startTimeInput.value = entry.startTime;
  endTimeInput.value = entry.endTime;
  
  // Set overnight checkbox
  const overnightCheckbox = document.getElementById('overnightCheckbox');
  if (overnightCheckbox) {
    overnightCheckbox.checked = entry.isOvernight || false;
  }
  
  editIndex = index;
  showCancelEditBtn();
  dateInput.focus();
}

// Show cancel edit button
function showCancelEditBtn() {
  const submitBtn = form.querySelector('button[type="submit"]');
  if (editIndex !== null) {
    submitBtn.textContent = 'Update Entry';
    submitBtn.classList.remove('bg-[#A6D6D6]', 'hover:bg-[#9ECAD6]');
    submitBtn.classList.add('bg-[#8DD3B6]', 'hover:bg-[#7BC4A5]');
  } else {
    submitBtn.textContent = 'Add Entry';
    submitBtn.classList.remove('bg-[#8DD3B6]', 'hover:bg-[#7BC4A5]');
    submitBtn.classList.add('bg-[#A6D6D6]', 'hover:bg-[#9ECAD6]');
  }
}

function saveEntries() {
  localStorage.setItem(getStorageKey(), JSON.stringify(entries));
}

function parseTime(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatHours(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function formatTimeAMPM(time24) {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getMonthName(monthIndex) {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return months[monthIndex] || "";
}

function capitalizeWords(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function getDaySuffix(day) {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function checkTimeConflict(newDate, newStartTime, newEndTime, newIsOvernight, editIndex) {
  // Get existing entries for the same date (excluding the entry being edited)
  const sameDayEntries = entries.filter((entry, index) => {
    return entry.date === newDate && index !== editIndex;
  });
  
  if (sameDayEntries.length === 0) {
    return null; // No conflicts if no other entries on the same day
  }
  
  // Convert new times to minutes for comparison
  const newStartMinutes = parseTime(newStartTime);
  const newEndMinutes = parseTime(newEndTime);
  
  // Adjust end time for overnight work
  const adjustedNewEndMinutes = newIsOvernight ? newEndMinutes + 1440 : newEndMinutes;
  
  // Check each existing entry for conflicts
  for (const existingEntry of sameDayEntries) {
    const existingStartMinutes = parseTime(existingEntry.startTime);
    const existingEndMinutes = parseTime(existingEntry.endTime);
    
    // Adjust existing end time for overnight work
    const adjustedExistingEndMinutes = existingEntry.isOvernight ? existingEndMinutes + 1440 : existingEndMinutes;
    
    // Check for exact same times
    if (newStartMinutes === existingStartMinutes && adjustedNewEndMinutes === adjustedExistingEndMinutes) {
      return `Time conflict: You already have an entry with the same start time (${formatTimeAMPM(newStartTime)}) and end time (${formatTimeAMPM(newEndTime)}) on ${newDate}`;
    }
    
    // Check for overlapping times
    const newOverlapsExisting = newStartMinutes < adjustedExistingEndMinutes && adjustedNewEndMinutes > existingStartMinutes;
    const existingOverlapsNew = existingStartMinutes < adjustedNewEndMinutes && adjustedExistingEndMinutes > newStartMinutes;
    
    if (newOverlapsExisting || existingOverlapsNew) {
      const existingStartFormatted = formatTimeAMPM(existingEntry.startTime);
      const existingEndFormatted = formatTimeAMPM(existingEntry.endTime);
      const existingOvernight = existingEntry.isOvernight ? ' (overnight)' : '';
      
      return `Time conflict: Your new entry (${formatTimeAMPM(newStartTime)} - ${formatTimeAMPM(newEndTime)}${newIsOvernight ? ' overnight' : ''}) overlaps with existing entry (${existingStartFormatted} - ${existingEndFormatted}${existingOvernight}) on ${newDate}`;
    }
  }
  
  return null; // No conflicts found
}

// --- Dynamic UI Enhancements ---
// Toast notification
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `px-4 py-2 rounded shadow text-white font-semibold transition-all duration-300 ${type === 'error' ? 'bg-red-500' : 'bg-blue-600'}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// Custom validation message
function showValidationMessage(message) {
  // Hide any existing success message first
  hideSuccessMessage();
  
  const validationContainer = document.getElementById('validationContainer');
  const validationMessage = document.getElementById('validationMessage');
  const backdropOverlay = document.getElementById('backdropOverlay');
  validationMessage.textContent = message;
  validationContainer.classList.remove('hidden');
  backdropOverlay.classList.remove('hidden');
}

function hideValidationMessage() {
  const validationContainer = document.getElementById('validationContainer');
  const backdropOverlay = document.getElementById('backdropOverlay');
  validationContainer.classList.add('hidden');
  backdropOverlay.classList.add('hidden');
}

// Success message
function showSuccessMessage(message) {
  // Hide any existing validation message first
  hideValidationMessage();
  
  const successContainer = document.getElementById('successContainer');
  const successMessage = document.getElementById('successMessage');
  const successBackdropOverlay = document.getElementById('successBackdropOverlay');
  successMessage.textContent = message;
  successContainer.classList.remove('hidden');
  successBackdropOverlay.classList.remove('hidden');
  
  // Auto-hide success message after 3 seconds
  setTimeout(() => {
    hideSuccessMessage();
  }, 3000);
}

function hideSuccessMessage() {
  const successContainer = document.getElementById('successContainer');
  const successBackdropOverlay = document.getElementById('successBackdropOverlay');
  successContainer.classList.add('hidden');
  successBackdropOverlay.classList.add('hidden');
}

// Delete confirmation
function showDeleteConfirmation(entry, index) {
  const validationContainer = document.getElementById('validationContainer');
  const validationMessage = document.getElementById('validationMessage');
  const closeValidation = document.getElementById('closeValidation');
  const backdropOverlay = document.getElementById('backdropOverlay');
  
  // Update the message and button
  validationMessage.innerHTML = `Are you sure you want to delete this entry?<br><br><strong>Date:</strong> ${entry.date}<br><strong>Time:</strong> ${formatTimeAMPM(entry.startTime)} - ${formatTimeAMPM(entry.endTime)}${entry.isOvernight ? ' <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">+1</span>' : ''}<br><strong>Hours:</strong> ${formatHours(entry.totalMinutes)}`;
  closeValidation.textContent = 'Cancel';
  
  // Show the container and backdrop
  validationContainer.classList.remove('hidden');
  backdropOverlay.classList.remove('hidden');
  
  // Create a new confirm button
  let confirmBtn = document.getElementById('confirmDelete');
  if (!confirmBtn) {
    confirmBtn = document.createElement('button');
    confirmBtn.id = 'confirmDelete';
    confirmBtn.className = 'bg-[#FFB3BA] text-white py-1 px-4 rounded text-xs font-semibold hover:bg-[#FF9AA2] transition-all duration-300 ml-2';
    confirmBtn.textContent = 'Delete';
    closeValidation.parentNode.appendChild(confirmBtn);
  }
  
  // Handle confirm delete
  confirmBtn.onclick = () => {
    console.log('=== DELETE CONFIRMATION DEBUG ===');
    console.log(`Deleting entry at index: ${index}`);
    console.log(`Total entries before delete: ${entries.length}`);
    console.log(`Entry to delete:`, entries[index]);
    
    // Remove the entry
    entries.splice(index, 1);
    saveEntries();
    
    console.log(`Total entries after delete: ${entries.length}`);
    console.log('===============================');
    
    // Update main table and summary
    updateTable();
    updateSummaryAndHeader();
    
    // Refresh the modal table if it's open
    const entriesModal = document.getElementById('entriesModal');
    if (!entriesModal.classList.contains('hidden')) {
      try {
        updateModalTable();
      } catch (error) {
        console.log('Modal table update error:', error);
        // If there's an error, just close the modal
        entriesModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
      }
    }
    
    // Show success message
    showSuccessMessage('Entry deleted successfully!');
    
    // Hide validation message and clean up
    hideValidationMessage();
    
    // Remove the confirm button
    if (confirmBtn) {
      confirmBtn.remove();
    }
  };
  
  // Handle cancel
  closeValidation.onclick = () => {
    hideValidationMessage();
    // Remove the confirm button
    if (confirmBtn) {
      confirmBtn.remove();
    }
  };
}

// Add close success event listener
document.addEventListener('DOMContentLoaded', () => {
  const closeSuccess = document.getElementById('closeSuccess');
  
  if (closeSuccess) {
    closeSuccess.addEventListener('click', hideSuccessMessage);
  }
});

// --- Modified updateTable for animation and edit highlight ---
function updateTable() {
  entriesTableBody.innerHTML = '';
  
  // Filter entries to only show current pay period
  const { startDate, endDate } = calculatePayPeriodRange();
  const currentPayPeriodEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= startDate && entryDate <= endDate;
  });
  
  // Sort entries by date descending
  const sortedEntries = [...currentPayPeriodEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
  sortedEntries.forEach((entry, index) => {
    const tr = document.createElement('tr');
    // Different colors for alternating rows with better contrast
    const rowClass = index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100';
    const editClass = editIndex === index ? ' ring-4 ring-yellow-300' : '';
    
    tr.className = `text-[#374151] transition-all duration-300 ${rowClass}${editClass}`;
    tr.innerHTML = `
      <td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl whitespace-nowrap border-b border-gray-200">${entry.date}</td>
      <td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl whitespace-nowrap border-b border-gray-200">${formatTimeAMPM(entry.startTime)}</td>
      <td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl whitespace-nowrap border-b border-gray-200">${formatTimeAMPM(entry.endTime)}${entry.isOvernight ? ' <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">+1</span>' : ''}</td>
      <td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl whitespace-nowrap border-b border-gray-200 font-medium text-[#A6D6D6]">${formatHours(entry.totalMinutes)}</td>
      <td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl whitespace-nowrap border-b border-gray-200">
        <button class="table-action-edit bg-[#8DD3B6] hover:bg-[#7BC4A5] text-white font-bold py-1 px-2 rounded transition mr-1 text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-xl" data-edit-index="${entries.indexOf(entry)}" aria-label="Edit Entry">Edit</button>
        <button class="table-action-delete bg-[#FFB3BA] hover:bg-[#FF9AA2] text-white font-bold py-1 px-2 rounded transition text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-xl" data-index="${entries.indexOf(entry)}" aria-label="Delete Entry">Delete</button>
      </td>
    `;
    tr.style.opacity = 0;
    entriesTableBody.appendChild(tr);
    setTimeout(() => { tr.style.opacity = 1; }, 10);
  });

  const hasEntries = currentPayPeriodEntries.length > 0;
  entriesTable.classList.toggle('hidden', !hasEntries);
}

// --- Pay Period Functions ---
function initializePayPeriodSelector() {
  const payPeriodInput = document.getElementById('payPeriodDay');
  const editPayPeriodBtn = document.getElementById('editPayPeriodBtn');
  
  if (payPeriodInput && editPayPeriodBtn) {
    // Load saved pay period day from localStorage
    const savedPayPeriodDay = localStorage.getItem('payPeriodDay');
    if (savedPayPeriodDay) {
      payPeriodDay = parseInt(savedPayPeriodDay);
      payPeriodInput.value = payPeriodDay;
    }
    
    // Check if user has already set a pay period
    const hasSetPayPeriod = localStorage.getItem('hasSetPayPeriod');
    if (hasSetPayPeriod === 'true') {
      payPeriodInput.disabled = true;
      editPayPeriodBtn.textContent = 'Edit';
    } else {
      payPeriodInput.disabled = false;
      editPayPeriodBtn.textContent = 'Save';
    }
    
    // Add event listeners for pay period changes
    payPeriodInput.addEventListener('change', (e) => {
      const value = parseInt(e.target.value);
      if (value >= 1 && value <= 31) {
        payPeriodDay = value;
        localStorage.setItem('payPeriodDay', payPeriodDay.toString());
        updateSummaryAndHeader();
      } else {
        // Reset to valid value if invalid input
        e.target.value = payPeriodDay;
        showValidationMessage('Pay period day must be between 1 and 31');
      }
    });
    
    // Also update on input for real-time feedback
    payPeriodInput.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      if (value >= 1 && value <= 31) {
        payPeriodDay = value;
        localStorage.setItem('payPeriodDay', payPeriodDay.toString());
        updateSummaryAndHeader();
      }
    });
    
    // Handle edit/save button
    editPayPeriodBtn.addEventListener('click', () => {
      if (payPeriodInput.disabled) {
        // Enable editing
        payPeriodInput.disabled = false;
        payPeriodInput.focus();
        editPayPeriodBtn.textContent = 'Save';
        editPayPeriodBtn.classList.remove('bg-[#A6D6D6]', 'hover:bg-[#9ECAD6]');
        editPayPeriodBtn.classList.add('bg-[#8DD3B6]', 'hover:bg-[#7BC4A5]');
      } else {
        // Save and disable
        const value = parseInt(payPeriodInput.value);
        if (value >= 1 && value <= 31) {
          payPeriodDay = value;
          localStorage.setItem('payPeriodDay', payPeriodDay.toString());
          localStorage.setItem('hasSetPayPeriod', 'true');
          payPeriodInput.disabled = true;
          editPayPeriodBtn.textContent = 'Edit';
          editPayPeriodBtn.classList.remove('bg-[#8DD3B6]', 'hover:bg-[#7BC4A5]');
          editPayPeriodBtn.classList.add('bg-[#A6D6D6]', 'hover:bg-[#9ECAD6]');
          updateSummaryAndHeader();
          showSuccessMessage('Pay period start day saved successfully!');
        } else {
          showValidationMessage('Pay period day must be between 1 and 31');
        }
      }
    });
  }
}

function calculatePayPeriodRange(selectedDate = new Date()) {
  const currentDate = new Date(selectedDate);
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  let startDate, endDate;
  
  if (currentDay >= payPeriodDay) {
    // Current pay period: payPeriodDay of current month to payPeriodDay-1 of next month
    startDate = new Date(currentYear, currentMonth, payPeriodDay);
    endDate = new Date(currentYear, currentMonth + 1, payPeriodDay - 1, 23, 59, 59);
  } else {
    // Previous pay period: payPeriodDay of previous month to payPeriodDay-1 of current month
    startDate = new Date(currentYear, currentMonth - 1, payPeriodDay);
    endDate = new Date(currentYear, currentMonth, payPeriodDay - 1, 23, 59, 59);
  }
  
  return { startDate, endDate };
}

function isDateInCurrentPayPeriod(date) {
  const { startDate, endDate } = calculatePayPeriodRange();
  const entryDate = new Date(date);
  return entryDate >= startDate && entryDate <= endDate;
}

function getNextPayPeriodRange() {
  const { startDate, endDate } = calculatePayPeriodRange();
  const nextStartDate = new Date(endDate);
  nextStartDate.setDate(nextStartDate.getDate() + 1);
  const nextEndDate = new Date(nextStartDate);
  nextEndDate.setMonth(nextEndDate.getMonth() + 1);
  nextEndDate.setDate(payPeriodDay - 1);
  nextEndDate.setHours(23, 59, 59);
  
  return { startDate: nextStartDate, endDate: nextEndDate };
}

// Global functions for button clicks
function handleFilterClick() {
  const periodStartDate = document.getElementById('periodStartDate');
  const periodEndDate = document.getElementById('periodEndDate');
  
  if (!periodStartDate || !periodEndDate) {
    return;
  }
  
  if (!periodStartDate.value || !periodEndDate.value) {
    showValidationMessage('Please select both start and end dates for filtering');
    return;
  }
  
  const startDate = new Date(periodStartDate.value);
  const endDate = new Date(periodEndDate.value);
  endDate.setHours(23, 59, 59);
  
  if (startDate > endDate) {
    showValidationMessage('Start date cannot be after end date');
    return;
  }
  
  // Simple direct update
  const modalTable = document.getElementById('modalEntriesTable');
  if (modalTable) {
    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });
    
    if (filteredEntries.length === 0) {
      modalTable.innerHTML = '<p class="text-center text-gray-500 text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl py-8">No entries found for selected period</p>';
    } else {
      let html = '<div class="overflow-x-auto"><table class="min-w-full bg-white border border-gray-200 rounded-xl shadow-lg">';
      html += '<thead><tr class="bg-gradient-to-r from-[#FFEAEA] to-[#F5CBCB] text-[#374151]">';
      html += '<th class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-semibold border-b border-gray-200 whitespace-nowrap">Date</th>';
      html += '<th class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-semibold border-b border-gray-200 whitespace-nowrap">Start</th>';
      html += '<th class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-semibold border-b border-gray-200 whitespace-nowrap">End</th>';
      html += '<th class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-semibold border-b border-gray-200 whitespace-nowrap">Hours</th>';
      html += '<th class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-semibold border-b border-gray-200 whitespace-nowrap">Actions</th>';
      html += '</tr></thead><tbody>';
      
      filteredEntries.forEach((entry, index) => {
        const rowClass = index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100';
        html += `<tr class="${rowClass} transition-colors duration-200">`;
        html += `<td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl border-b border-gray-200 whitespace-nowrap">${entry.date}</td>`;
        html += `<td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl border-b border-gray-200 whitespace-nowrap">${formatTimeAMPM(entry.startTime)}</td>`;
        html += `<td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl border-b border-gray-200 whitespace-nowrap">${formatTimeAMPM(entry.endTime)}${entry.isOvernight ? ' <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">+1</span>' : ''}</td>`;
        html += `<td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl border-b border-gray-200 font-medium text-[#A6D6D6] whitespace-nowrap">${formatHours(entry.totalMinutes)}</td>`;
        html += `<td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl border-b border-gray-200 whitespace-nowrap">`;
        html += `<button class="table-action-edit bg-[#8DD3B6] hover:bg-[#7BC4A5] text-white font-bold py-1 px-2 rounded transition mr-1 text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-xl shadow-sm hover:shadow-md" data-edit-index="${entries.indexOf(entry)}" aria-label="Edit Entry">Edit</button>`;
        html += `<button class="table-action-delete bg-[#FFB3BA] hover:bg-[#FF9AA2] text-white font-bold py-1 px-2 rounded transition text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-xl shadow-sm hover:shadow-md" data-index="${entries.indexOf(entry)}" aria-label="Delete Entry">Delete</button>`;
        html += '</td></tr>';
      });
      
      html += '</tbody></table></div>';
      modalTable.innerHTML = html;
      
      // Add event listeners to the new table buttons
      addTableEventListeners();
    }
  }
}

function handleShowAllClick() {
  const modalTable = document.getElementById('modalEntriesTable');
  if (modalTable) {
    if (entries.length === 0) {
      modalTable.innerHTML = '<p class="text-center text-gray-500 text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl py-8">No entries available</p>';
    } else {
      let html = '<div class="overflow-x-auto"><table class="min-w-full bg-white border border-gray-200 rounded-xl shadow-lg">';
      html += '<thead><tr class="bg-gradient-to-r from-[#FFEAEA] to-[#F5CBCB] text-[#374151]">';
      html += '<th class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-semibold border-b border-gray-200 whitespace-nowrap">Date</th>';
      html += '<th class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-semibold border-b border-gray-200 whitespace-nowrap">Start</th>';
      html += '<th class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-semibold border-b border-gray-200 whitespace-nowrap">End</th>';
      html += '<th class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-semibold border-b border-gray-200 whitespace-nowrap">Hours</th>';
      html += '<th class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl font-semibold border-b border-gray-200 whitespace-nowrap">Actions</th>';
      html += '</tr></thead><tbody>';
      
      entries.forEach((entry, index) => {
        const rowClass = index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100';
        html += `<tr class="${rowClass} transition-colors duration-200">`;
        html += `<td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl border-b border-gray-200 whitespace-nowrap">${entry.date}</td>`;
        html += `<td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl border-b border-gray-200 whitespace-nowrap">${formatTimeAMPM(entry.startTime)}</td>`;
        html += `<td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl border-b border-gray-200 whitespace-nowrap">${formatTimeAMPM(entry.endTime)}${entry.isOvernight ? ' <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">+1</span>' : ''}</td>`;
        html += `<td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl border-b border-gray-200 font-medium text-[#A6D6D6] whitespace-nowrap">${formatHours(entry.totalMinutes)}</td>`;
        html += `<td class="px-3 py-3 text-left text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl border-b border-gray-200 whitespace-nowrap">`;
        html += `<button class="table-action-edit bg-[#8DD3B6] hover:bg-[#7BC4A5] text-white font-bold py-1 px-2 rounded transition mr-1 text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-xl shadow-sm hover:shadow-md" data-edit-index="${entries.indexOf(entry)}" aria-label="Edit Entry">Edit</button>`;
        html += `<button class="table-action-delete bg-[#FFB3BA] hover:bg-[#FF9AA2] text-white font-bold py-1 px-2 rounded transition text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-xl shadow-sm hover:shadow-md" data-index="${entries.indexOf(entry)}" aria-label="Delete Entry">Delete</button>`;
        html += '</td></tr>';
      });
      
      html += '</tbody></table></div>';
      modalTable.innerHTML = html;
      
      // Add event listeners to the new table buttons
      addTableEventListeners();
    }
  }
}

// Function to add event listeners to table buttons
function addTableEventListeners() {
  // Add event listeners to modal table buttons
  const modalEntriesTable = document.getElementById('modalEntriesTable');
  
  modalEntriesTable.querySelectorAll('.table-action-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const editIndex = parseInt(e.target.dataset.editIndex);
      editEntry(editIndex);
      const entriesModal = document.getElementById('entriesModal');
      entriesModal.classList.add('hidden');
      document.getElementById('backdropOverlay').classList.add('hidden');
      document.body.style.overflow = 'auto';
    });
  });

  modalEntriesTable.querySelectorAll('.table-action-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      console.log('=== MODAL DELETE BUTTON CLICK ===');
      console.log(`Delete button clicked for index: ${index}`);
      console.log(`Total entries: ${entries.length}`);
      console.log(`Entry at index:`, entries[index]);
      console.log('==================================');
      
      showDeleteConfirmation(entries[index], index);
      // Don't close the modal - let the delete confirmation handle it
    });
  });
}

function initializePeriodSelector() {
  console.log('Initializing period selector...');
  const periodStartDate = document.getElementById('periodStartDate');
  const periodEndDate = document.getElementById('periodEndDate');
  
  if (periodStartDate && periodEndDate) {
    // Set default values to current pay period
    const { startDate, endDate } = calculatePayPeriodRange();
    
    // Format dates for input fields (YYYY-MM-DD)
    const formatDateForInput = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    periodStartDate.value = formatDateForInput(startDate);
    periodEndDate.value = formatDateForInput(endDate);
    
    // Load saved values from localStorage if they exist
    const savedStartDate = localStorage.getItem('periodStartDate');
    const savedEndDate = localStorage.getItem('periodEndDate');
    
    if (savedStartDate && savedEndDate) {
      periodStartDate.value = savedStartDate;
      periodEndDate.value = savedEndDate;
    }
    
    // Save values when changed
    periodStartDate.addEventListener('change', () => {
      localStorage.setItem('periodStartDate', periodStartDate.value);
    });
    
    periodEndDate.addEventListener('change', () => {
      localStorage.setItem('periodEndDate', periodEndDate.value);
    });
    
    console.log('Period selector initialized successfully');
  } else {
    console.log('Some elements not found, will retry when modal opens');
  }
}

// --- Only this part changed ---
function updateSummaryAndHeader() {
  const now = new Date();
  // Calculate pay period based on selected day
  const { startDate, endDate } = calculatePayPeriodRange();

  let monthlyMinutes = 0;
  entries.forEach(e => {
    const d = new Date(e.date);
    if (d >= startDate && d <= endDate) {
      monthlyMinutes += e.totalMinutes;
      console.log(`Entry ${e.date}: ${e.startTime}-${e.endTime} = ${e.totalMinutes} minutes (${formatHours(e.totalMinutes)})`);
    }
  });

  const hours = Math.floor(monthlyMinutes / 60);
  const minutes = Math.round(monthlyMinutes % 60);
  console.log(`Total monthly minutes: ${monthlyMinutes} = ${hours}h ${minutes}m`);
  
  const startMonth = getMonthName(startDate.getMonth());
  const endMonth = getMonthName(endDate.getMonth());
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  let periodLine = `${startDay}${getDaySuffix(startDay)} ${startMonth} - ${endDay}${getDaySuffix(endDay)} ${endMonth}`;
  periodLine = capitalizeWords(periodLine);
  
  // Update the separate elements for better styling
  const periodLineElement = document.getElementById('periodLine');
  const totalHoursElement = document.getElementById('totalHours');
  
  if (periodLineElement) {
    periodLineElement.textContent = periodLine;
  }
  
  if (totalHoursElement) {
    totalHoursElement.textContent = `${hours} Hours : ${minutes.toString().padStart(2, '0')} Minutes`;
  }
}
// ----------------------------

// --- Dynamic summary update on date change ---
let lastSummaryDate = new Date().getDate();
setInterval(() => {
  const now = new Date();
  if (now.getDate() !== lastSummaryDate) {
    lastSummaryDate = now.getDate();
    updateSummaryAndHeader();
  }
}, 60 * 1000); // check every minute

// --- Export period dropdown logic ---
// Removed export dropdown functionality since export PDF is no longer needed

function showSingleEntryPopup(entry) {
  // Create a different popup for single entry
  const singleEntryModal = document.createElement('div');
  singleEntryModal.id = 'singleEntryModal';
  singleEntryModal.className = 'fixed inset-0 flex items-center justify-center z-[70] bg-black bg-opacity-50 backdrop-blur-sm';
  
  const entryDate = new Date(entry.date);
  const formattedDate = entryDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  singleEntryModal.innerHTML = `
    <div class="bg-white rounded-2xl p-6 mx-4 max-w-md w-full shadow-2xl">
      <div class="text-center">
        <div class="mb-4">
          <h3 class="text-xl font-bold text-[#374151] mb-2">Single Entry Found</h3>
          <p class="text-sm text-[#6B7280]">You have only one entry in your records</p>
        </div>
        
        <div class="bg-[#F8FAFC] rounded-lg p-4 mb-4">
          <div class="text-left space-y-2">
            <div class="flex justify-between">
              <span class="font-semibold text-[#374151]">Date:</span>
              <span class="text-[#374151]">${formattedDate}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold text-[#374151]">Start Time:</span>
              <span class="text-[#374151]">${formatTimeAMPM(entry.startTime)}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold text-[#374151]">End Time:</span>
              <span class="text-[#374151]">${formatTimeAMPM(entry.endTime)}${entry.isOvernight ? ' <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">+1</span>' : ''}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold text-[#374151]">Total Hours:</span>
              <span class="text-[#A6D6D6] font-bold">${formatHours(entry.totalMinutes)}</span>
            </div>
          </div>
        </div>
        
        <div class="flex justify-center space-x-3">
          <button id="closeSingleEntry" class="bg-[#A6D6D6] hover:bg-[#9ECAD6] text-[#374151] py-2 px-6 rounded-lg font-semibold transition-all duration-300">Close</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(singleEntryModal);
  
  // Close button event
  document.getElementById('closeSingleEntry').addEventListener('click', () => {
    singleEntryModal.remove();
  });
  
  // Close when clicking outside
  singleEntryModal.addEventListener('click', (e) => {
    if (e.target === singleEntryModal) {
      singleEntryModal.remove();
    }
  });
}