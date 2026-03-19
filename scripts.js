document.addEventListener('DOMContentLoaded', function () {
	const branding = document.getElementById('content');
	const colorElem1 = document.getElementById('color1');
	const colorElem2 = document.getElementById('color2');
	const colorElem3 = document.getElementById('color3');
	const accentElem2 = document.getElementById('accentColor2');
	const accentElem3 = document.getElementById('accentColor3');
	const fontNameElem = document.getElementById('font-name');
	const currentUrl = new URL(window.location.href);
	const urlWithoutQuery = currentUrl.origin + currentUrl.pathname;
	
	let favoriteButton = document.getElementById('favorite-heart');
	let heartOutline = document.querySelector('.heart-outline');
	let heartFill = document.querySelector('.heart-fill');
	let contentBody = document.querySelector('#content');
	let contentH2 = document.querySelector('#content h2');
	let contentH3 = document.querySelector('#content h3');
	
	// Initialize URL params at the top
	const urlParams = new URLSearchParams(window.location.search);
	console.log(urlParams);
	
	// Track API completion state
	let apiState = {
		fontReady: false,
		colorsReady: false
	};
	
	function getContrastColor(hexColor) {
	  // 1. Remove '#' if present and expand 3-digit hex to 6-digit
	  let hex = hexColor.replace('#', '');
	  if (hex.length === 3) {
	    hex = hex.split('').map(char => char + char).join('');
	  }
	
	  // 2. Convert hex to RGB values
	  const r = parseInt(hex.substring(0, 2), 16);
	  const g = parseInt(hex.substring(2, 4), 16);
	  const b = parseInt(hex.substring(4, 6), 16);
	
	  // 3. Calculate relative luminance (using sRGB weights)
	  // Formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
	  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
	
	  // 4. Return black for light backgrounds, white for dark backgrounds
	  // A threshold of ~0.5 (or 0.179 based on complex WCAG math) works best
	  return luminance > 0.5 ? '#000000' : '#ffffff';
	}
	
	// Show content when both APIs are complete
	function showContentIfReady() {
		console.log('showContentIfReady()');
		if (apiState.fontReady && apiState.colorsReady) {
			console.log('fontReady and ColorsReady');
			const previewElementContentWrapper = document.querySelector('.content-wrapper');
			if (previewElementContentWrapper && previewElementContentWrapper.classList.contains('hidden')) {
				setTimeout(() => {
					previewElementContentWrapper.classList.remove('hidden');
				}, 100);
			}
			// Update URL params
			let fontName = document.getElementById('font-name').innerHTML;
			let colorName1 = document.getElementById('color1').innerHTML;
			let colorName2 = document.getElementById('color2').innerHTML;
			let colorName3 = document.getElementById('color3').innerHTML;
			urlParams.set('font', fontName);
			urlParams.set('color1', colorName1);
			urlParams.set('color2', colorName2);
			urlParams.set('color3', colorName3);
			// Update the browser's URL bar with the new params
			window.history.pushState({}, '', '?' + urlParams.toString());
		}
	}

    // Function to fetch and filter fonts based on a category
    async function getFontsByCategory(category) {
        // ⚠️ IMPORTANT: Replace 'YOUR_API_KEY' with your actual, restricted Google Fonts API Key.
        const API_KEY = 'AIzaSyAZHSw9zt0TGMugOTbcPARraMfUQf0HQyQ';
        const BASE_URL = 'https://www.googleapis.com/webfonts/v1/webfonts';
        
        // Construct the URL with parameters
        // sort=alpha is required for capability=APPLY_CSS to work as an implicit filter.
        // capability=APPLY_CSS ensures only basic font info is returned, which is lightweight.
        const url = `${BASE_URL}?key=${API_KEY}&category=${category}&sort=alpha`;
        
        console.log(url);

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // The API returns ALL fonts. We must filter the results based on the 'category' property.
            // The category is provided by the user's <select> element.
            const filteredFonts = data.items.filter(font => {
                // Convert to lowercase for reliable comparison
                return font.category.toLowerCase() === category.toLowerCase();
            });

            return filteredFonts; // Returns an array of font objects

        } catch (error) {
            console.error("Error fetching Google Fonts:", error);
            return []; // Return an empty array on error
        }
    }
    
	// Randomly choose Google Font from selected catgory and Google Fonts API
    async function filterFontsByCategory(category) {
        console.log(`Fetching fonts for category: ${category}...`);
            
        const fonts = await getFontsByCategory(category);
        
        if (fonts.length > 0) {
            console.log(`Found ${fonts.length} fonts.`);
            
            // 2. Randomly select a font for the branding generator
            const randomFont = fonts[Math.floor(Math.random() * fonts.length)];

            console.log("Randomly selected font: ", randomFont.family);

            // Load and apply the selected font
			const fontName = randomFont.family;
			const fontCategory = randomFont.category;
            loadAndApplyFont(fontName, fontCategory); 
        } else {
            console.log("No fonts found for this category.");
        }
    }
    
    /**
     * Loads a specified Google Font and applies it to a target element.
     * @param {object} font - The font object returned from the Google Fonts API.
     */
    function loadAndApplyFont(fontName, fontCategory) {
        
        // 1. Sanitize the font name for the URL (replace spaces with '+')
        const webSafeFontName = fontName.replace(/ /g, '+');
        
        // 2. Construct the Google Fonts API CSS link
        // We only load the 'regular' 400 weight for simplicity.
        const cssUrl = `https://fonts.googleapis.com/css2?family=${webSafeFontName}&display=swap`;

        // 3. Create a new <link> element
        const link = document.createElement('link');
        link.href = cssUrl;
        link.rel = 'stylesheet';
        
        // 4. Inject the link into the document <head>
        document.head.appendChild(link);

        // 5. Apply the font to your preview element once the font has loaded
        const previewElement = document.getElementById('content');
        link.onload = () => {
            if (previewElement) {
                // Apply the font family using CSS
                previewElement.style.fontFamily = `'${fontName}', ${fontCategory}`;
                // Mark font as ready and check if content should be shown
                apiState.fontReady = true;
                showContentIfReady();
                console.log(`Font '${fontName}' loaded and applied with loadAndApplyFont().`);
            }
        };

        // 6. Display the name of the font in the UI
        fontNameElem.innerHTML = fontName;
        
        // Optional: Clean up older dynamically loaded fonts if you want only one active at a time
        // You could add logic here to remove any existing font <link> tags before adding the new one.
    }
    
    // Load Google Font from a font name
    /*
    function loadGoogleFontWithLoader(fontName) {
	  // Replace spaces with '+' for the URL
	  console.log('fontname: ', fontName);
	  const formattedName = fontName.replace(/\s+/g, '+');
	  console.log('formattedname: ', formattedName);
	  const link = document.createElement('link');
	
	  link.rel = 'stylesheet';
	  link.href = `https://fonts.googleapis.com/css2?family=${formattedName}&display=swap`;
	
	  document.head.appendChild(link);
	  
	  const previewElement = document.getElementById('content');
	    link.onload = () => {
	        if (previewElement) {
	            // Apply the font family using CSS
	            previewElement.style.fontFamily = `'${fontName}'`;
	            // Mark font as ready and check if content should be shown
	            apiState.fontReady = true;
	            showContentIfReady();
	            console.log(`Font '${fontName}' loaded and applied.`);
	        }
	    };
	}
	*/
    
    // Huemint API Call
	function getHuemintColors() {
		var huemint_data = {
			"mode":"transformer", // transformer, diffusion or random
			"num_colors":4, // max 12, min 2
			"temperature":"1.2", // max 2.4, min 0
			"num_results":1, // max 50 for transformer, 5 for diffusion
			"adjacency":[ "0", "65", "45", "35", "65", "0", "35", "65", "45", "35", "0", "35", "35", "65", "35", "0"], // nxn adjacency matrix as a flat array of strings
			"palette":["#000000", "-", "-", "-"], // locked colors as hex codes, or '-' if blank
		}

		fetch("https://api.huemint.com/color", {
			method: "POST",
			headers: {
				"Content-Type": "application/json; charset=utf-8"
			},
			body: JSON.stringify(huemint_data)
		})
		.then(response => response.json())
		.then(data => {
			//console.log("HueMint Data Object: ", JSON.stringify(data, null, 2));
			
			// Generate either 1 or 2 randomly
			let randomNum = Math.floor(Math.random() * 2) + 1;
			let oppositeRandomNum = 3 - randomNum;
			
			// Choose if the first or second returned color is the primary color
			let primaryColor = data.results[0].palette[randomNum];
			let secondaryColor = data.results[0].palette[oppositeRandomNum];
			let tertiaryColor = data.results[0].palette[3];
			
			colorElem1.innerHTML = primaryColor;
			colorElem2.innerHTML = secondaryColor;
			colorElem3.innerHTML = tertiaryColor;
			
			const textColor = getContrastColor(primaryColor);

			// Apply colors using individual style properties so we don't overwrite other inline styles (e.g., fontFamily)
			contentH2.style.color = textColor;
			contentH3.style.color = textColor;
			
			contentBody.style.backgroundColor = primaryColor;

			// Preserve other inline styles by assigning properties individually
			colorElem1.style.backgroundColor = primaryColor;
			colorElem1.style.color = textColor;
			colorElem2.style.backgroundColor = secondaryColor;
			colorElem2.style.color = getContrastColor(secondaryColor);
			colorElem3.style.backgroundColor = tertiaryColor;
			colorElem3.style.color = getContrastColor(tertiaryColor);
			accentElem2.style.backgroundColor = secondaryColor;
			accentElem3.style.backgroundColor = tertiaryColor;
			showContentIfReady();
		})
		.catch(error => console.error("Error:", error));
	}
	

    // 1. Get the category from the <select> element
    const categorySelect = document.getElementById('font-select');

    categorySelect.addEventListener('change', async (event) => {
        const selectedCategory = event.target.value; // e.g., "sans-serif", "serif", "display"

        if (selectedCategory) {
            filterFontsByCategory(selectedCategory);
        }
    });
    
    // Check for saved font and colors in the URL parameters
	if (urlParams.size !== 0) {
		// Get font and colors from URL parameters
		const color1Param = urlParams.get('color1');
		const color2Param = urlParams.get('color2');
		const color3Param = urlParams.get('color3');
		const fontParam = urlParams.get('font');
		colorElem1.innerHTML = color1Param;
		colorElem2.innerHTML = color2Param;
		colorElem3.innerHTML = color3Param;
		fontNameElem.innerHTML = fontParam;
		
		// Apply colors using individual style properties so we don't overwrite other inline styles (e.g., fontFamily)
		const textColor = getContrastColor(color1Param);
		contentH2.style.color = textColor;
		contentH3.style.color = textColor;
		
		// Set Background color
		contentBody.style.backgroundColor = color1Param;
		
		// Preserve other inline styles by assigning properties individually
		colorElem1.style.backgroundColor = color1Param;
		colorElem1.style.color = textColor;
		colorElem2.style.backgroundColor = color2Param;
		colorElem2.style.color = getContrastColor(color2Param);
		colorElem3.style.backgroundColor = color3Param;
		colorElem3.style.color = getContrastColor(color3Param);
		accentElem2.style.backgroundColor = color2Param;
		accentElem3.style.backgroundColor = color3Param;
		
		// Load font by name from parameters
		//loadGoogleFontWithLoader(fontParam);
		loadAndApplyFont(fontParam);
		
		// Mark both as ready since they're loaded from URL params (not APIs)
		apiState.fontReady = true;
		apiState.colorsReady = true;
		showContentIfReady();
	} else {
		// Hide content wrapper initially
		const previewElementContentWrapper = document.querySelector('.content-wrapper');
		if (previewElementContentWrapper) {
			//previewElementContentWrapper.classList.add('hidden');
		}
		
		getHuemintColors();
		
		const categorySelect = document.getElementById('font-select');
        const selectedCategory = categorySelect.value; // e.g., "sans-serif", "serif", "display"
		filterFontsByCategory(selectedCategory);
	}
	
    // Change font and color on click
	contentBody.addEventListener('click', function() {
        
        // Hide the content until both APIs complete
        const previewElementContentWrapper = document.querySelector('.content-wrapper');
        //previewElementContentWrapper.classList.add('hidden');

        getHuemintColors();
        filterFontsByCategory(categorySelect.value);
        
        if (favoriteButton.classList.contains('active')) {
			favoriteButton.classList.remove('active');
		}

		heartFill.classList.add('display-none');
		heartOutline.classList.remove('display-none');
	})
	
	// Change Colors on New Colors button click
	let colorsButton = document.getElementById('generate-colors-button');
	colorsButton.addEventListener('click', function() {
        
        // Hide the content until both APIs complete
        const previewElementContentWrapper = document.querySelector('.content-wrapper');
        previewElementContentWrapper.classList.add('hidden');

        getHuemintColors();
        
        if (favoriteButton.classList.contains('active')) {
			favoriteButton.classList.remove('active');
		}

		heartFill.classList.add('display-none');
		heartOutline.classList.remove('display-none');
	})
	
	// Change Font on Font Button click
	let fontButton = document.getElementById('generate-font-button');
	fontButton.addEventListener('click', function() {
        
        // Hide the content until both APIs complete
        const previewElementContentWrapper = document.querySelector('.content-wrapper');
        previewElementContentWrapper.classList.add('hidden');

        filterFontsByCategory(categorySelect.value);
        
        if (favoriteButton.classList.contains('active')) {
			favoriteButton.classList.remove('active');
		}

		heartFill.classList.add('display-none');
		heartOutline.classList.remove('display-none');
	})
	
	// Add favorite
	favoriteButton.addEventListener('click', function(event) {
		event.preventDefault();
		
		if (favoriteButton.classList.contains('active')) {
			heartFill.classList.add('display-none');
			heartOutline.classList.remove('display-none');
			favoriteButton.classList.remove('active');
		} else {
			heartFill.classList.remove('display-none');
			heartOutline.classList.add('display-none');
			favoriteButton.classList.add('active');
			
			let fontName = document.getElementById('font-name').innerHTML;
			let colorName1 = document.getElementById('color1').innerHTML;
			let colorName2 = document.getElementById('color2').innerHTML;
			let colorName3 = document.getElementById('color3').innerHTML;
			
			// Testing local storage for favorites
			const favorite = {
				font: fontName,
				colors: [colorName1, colorName2, colorName3],
				timestamp: Date.now()
			};
	
			// Saving to LocalStorage
			function saveFavorite(newFavorite) {
				const currentFavorites = JSON.parse(localStorage.getItem('myFavorites')) || [];
				currentFavorites.push(newFavorite);
				localStorage.setItem('myFavorites', JSON.stringify(currentFavorites));
			}
			
			saveFavorite(favorite);
	
			// Retrieving from LocalStorage
			const savedFavorites = JSON.parse(localStorage.getItem('myFavorites'));
			console.log("Saved Favorites from LocalStorage:", savedFavorites);
		}
	})
	
	// List Favorites
	let favoritesHTML = '';
	let favoritesWrapper = document.querySelector('.favorites-list');
	let favoritesList = document.getElementById('favorites-list');
	if (favoritesWrapper) {
		favoritesWrapper.classList.add('hidden');
	}
	const savedFavorites = JSON.parse(localStorage.getItem('myFavorites'));
	if (savedFavorites) {
		favoritesWrapper.classList.remove('hidden');
		savedFavorites.forEach((favorite, index) => {
			let textColor = getContrastColor(favorite.colors[0]);
			let favoriteLink = urlWithoutQuery + "?font=" + encodeURIComponent(favorite.font) + "&color1=" + encodeURIComponent(favorite.colors[0]) + "&color2=" + encodeURIComponent(favorite.colors[1]) + "&color3=" + encodeURIComponent(favorite.colors[2]);
			// fontName.replace(/\s+/g, '+');
			favoritesHTML += '<div id="favorite_' + index + '" class="column">';
			favoritesHTML += '<p><strong>Font:</strong> ';
			favoritesHTML += '<span id="font-name_' + index +'" class="font-name">' + favorite.font + '</span></p>';
			favoritesHTML += '<p><strong>Primary Color:</strong> ';
			favoritesHTML += '<span id="color1_' + index +'" class="color" style="background: ' + favorite.colors[0] + '; color: ' + textColor + ';">' + favorite.colors[0] + '</span></p>';
			/* Accent colors
			favoritesHTML += '<p><strong>Accent Color 1:</strong> ';
			favoritesHTML += '<span id="color2" class="color">' + favorite.colors[1] + '</span></p>';
			favoritesHTML += '<p><strong>Accent Color 2:</strong> ';
			favoritesHTML += '<span id="color3" class="color"' + favorite.colors[2] + '></span></p>';
			*/
			favoritesHTML += '<a href="' + favoriteLink + '" class="button button-secondary">Load Favorite</a>';
			favoritesHTML += '<a href="' + index + '" class="button button-secondary color-red deleteFavorite">Delete</a>';
			favoritesHTML += '</div>';
		});
		
		// Set all HTML at once after loop completes
		favoritesList.innerHTML = favoritesHTML;
		
		// Now add event listeners to all delete buttons
		savedFavorites.forEach((favorite, index) => {
			let deleteFavorite = document.querySelector('#favorite_' + index + ' .deleteFavorite');
			if (deleteFavorite) {
				deleteFavorite.addEventListener('click', function (event) {
					event.preventDefault();
					// Get the current favorites array
					const currentFavorites = JSON.parse(localStorage.getItem('myFavorites')) || [];
					// Remove the item at this index
					currentFavorites.splice(index, 1);
					// Save the updated array back to localStorage
					localStorage.setItem('myFavorites', JSON.stringify(currentFavorites));
					// Hide the deleted item from the UI
					let favoriteEntry = document.getElementById('favorite_' + index);
					favoriteEntry.style.opacity = "0";
					setTimeout(() => { favoriteEntry.style.display = "none"; }, 500);
				});
			}
		});
	}

}, false); // end DOMContentLoaded