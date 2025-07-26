# PowerShell script to remove all comments from files

function Remove-CommentsFromJS {
    param([string]$content)
    
    # Split into lines
    $lines = $content -split "`r?`n"
    $result = @()
    $inMultilineComment = $false
    
    foreach ($line in $lines) {
        $processedLine = $line
        
        # Handle multi-line comments
        if ($inMultilineComment) {
            if ($processedLine -match '\*/') {
                $processedLine = $processedLine -replace '^.*?\*/', ''
                $inMultilineComment = $false
            } else {
                continue
            }
        }
        
        # Check for start of multi-line comment
        if ($processedLine -match '/\*') {
            if ($processedLine -match '/\*.*?\*/') {
                # Complete multi-line comment on one line
                $processedLine = $processedLine -replace '/\*.*?\*/', ''
            } else {
                # Start of multi-line comment
                $processedLine = $processedLine -replace '/\*.*$', ''
                $inMultilineComment = $true
            }
        }
        
        # Remove single-line comments, but preserve URLs
        $processedLine = $processedLine -replace '(?<!:)//(?!//).*$', ''
        
        # Trim and add to result if not empty
        $processedLine = $processedLine.TrimEnd()
        if ($processedLine -ne '' -or $result.Count -eq 0) {
            $result += $processedLine
        }
    }
    
    return ($result -join "`n").Trim()
}

function Remove-CommentsFromHTML {
    param([string]$content)
    
    # Remove HTML comments
    $content = $content -replace '<!--[\s\S]*?-->', ''
    
    # Clean up extra whitespace
    $content = $content -replace '\n\s*\n\s*\n', "`n`n"
    
    return $content.Trim()
}

function Remove-CommentsFromCSS {
    param([string]$content)
    
    # Remove CSS comments
    $content = $content -replace '/\*[\s\S]*?\*/', ''
    
    # Clean up extra whitespace
    $content = $content -replace '\n\s*\n\s*\n', "`n`n"
    
    return $content.Trim()
}

function Remove-CommentsFromMD {
    param([string]$content)
    
    # Remove HTML comments from markdown files
    $content = $content -replace '<!--[\s\S]*?-->', ''
    
    return $content.Trim()
}

# Process all files
$files = @(
    @{Name='background.js'; Type='js'},
    @{Name='brave-diagnostic.js'; Type='js'},
    @{Name='content-minimal.js'; Type='js'},
    @{Name='content-original.js'; Type='js'},
    @{Name='content.js'; Type='js'},
    @{Name='extension.js'; Type='js'},
    @{Name='popup-fixed.js'; Type='js'},
    @{Name='popup-minimal.js'; Type='js'},
    @{Name='popup-original.js'; Type='js'},
    @{Name='popup.js'; Type='js'},
    @{Name='simple-test.js'; Type='js'},
    @{Name='test.html'; Type='html'},
    @{Name='debug-instructions.html'; Type='html'},
    @{Name='extension.html'; Type='html'},
    @{Name='popup.html'; Type='html'},
    @{Name='extension.css'; Type='css'},
    @{Name='popup.css'; Type='css'},
    @{Name='BRAVE_FIXES.md'; Type='md'},
    @{Name='BRAVE_TROUBLESHOOTING.md'; Type='md'},
    @{Name='DEBUG.md'; Type='md'},
    @{Name='FIXED_SUMMARY.md'; Type='md'},
    @{Name='ISSUE_SOLVED.md'; Type='md'}
)

foreach ($file in $files) {
    $filePath = "c:\Users\sidhe\Documents\GitHub\canvaHub\canvaHub-Fix\$($file.Name)"
    
    if (Test-Path $filePath) {
        Write-Host "Processing $($file.Name)..."
        
        $content = Get-Content $filePath -Raw -Encoding UTF8
        
        switch ($file.Type) {
            'js' { $cleanContent = Remove-CommentsFromJS $content }
            'html' { $cleanContent = Remove-CommentsFromHTML $content }
            'css' { $cleanContent = Remove-CommentsFromCSS $content }
            'md' { $cleanContent = Remove-CommentsFromMD $content }
        }
        
        Set-Content $filePath $cleanContent -Encoding UTF8 -NoNewline
        Write-Host "Cleaned $($file.Name)"
    } else {
        Write-Host "File not found: $($file.Name)"
    }
}

Write-Host "`nAll files processed!"
