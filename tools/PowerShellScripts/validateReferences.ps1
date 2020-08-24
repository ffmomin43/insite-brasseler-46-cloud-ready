# This script is used to validate references for partner Extensions projects to warn them before pushing a new revision into the cloud builds if they use an invalid reference.
param (
    [Parameter(Mandatory=$True)][string]$allowedLibrariesPath,
    [Parameter(Mandatory=$True)][string]$projectPath
)

function addDisallowedReference
{
    param (
        [Parameter(Mandatory=$True)][hashtable]$disallowedReferences,
        [Parameter(Mandatory=$True)][pscustomobject]$disallowedReference
    )

    if (-not $disallowedReferences.ContainsKey($disallowedReference.PackageName)) {
        $disallowedReferences[$disallowedReference.PackageName] = [pscustomobject]@{
            PackageName = $disallowedReference.PackageName
            PackageVersion = $disallowedReference.PackageVersion
            Libraries = @{ $disallowedReference.LibraryName = $disallowedReference.LibraryVersion }
        }
    } else {
        $disallowedReferences[$disallowedReference.PackageName].Libraries[$disallowedReference.LibraryName] = $disallowedReference.LibraryVersion
    }
}

$allowedLibrariesArray = Get-Content -Path $allowedLibrariesPath | ConvertFrom-Json

$allowedLibraries = @{}
foreach ($package in $allowedLibrariesArray) {
    $libraries = @{}
    foreach ($library in $package.Value.Libraries.psobject.properties) {
        $libraries[$library.Name] = $library.Value
    }

    $package.Value.Libraries = $libraries
    $allowedLibraries[$package.Name] = $package.Value
}

$nugetReferences = New-Object System.Collections.ArrayList
([xml](Get-Content -Path $projectPath)).Project.ItemGroup.Reference `
    | Where-Object { $null -ne $_.HintPath -and $_.HintPath -match ".*\\packages\\(?<PackageName>.*?)\.(?<PackageVersion>(\d+\.?)+)\\lib(\\.*)?\\(?<LibraryName>.*)\.dll" } `
    | ForEach-Object {
            $nugetReferenceInfo = [pscustomobject]@{
                PackageName = $Matches.PackageName
                PackageVersion = $Matches.PackageVersion
                LibraryName = $Matches.LibraryName
                LibraryVersion = $Matches.PackageVersion
            }

            if ($null -ne $_.Include -and $_.Include -match "(?<LibraryName>.*?), Version=(?<VersionNumber>.*?), Culture=(?<Culture>.*)(, PublicKeyToken=(?<PublicKeyToken>.*))?(, processorArchitecture=(?<ProcessorArchitecture>.*))?") {
                $nugetReferenceInfo.LibraryVersion = $Matches.VersionNumber
            }

            $nugetReferences.Add($nugetReferenceInfo) > $null
        }

$disallowedReferences = @{}
foreach ($reference in $nugetReferences) {

    # TODO Do we care if the version changes?
    if ($allowedLibraries.ContainsKey($reference.PackageName)) {
        $allowedLibraryPackage = $allowedLibraries[$reference.PackageName]

        # TODO Do we care if the version changes?
        if (-not $allowedLibraryPackage.Libraries.ContainsKey($reference.LibraryName)) {
            addDisallowedReference -disallowedReferences $disallowedReferences -disallowedReference $reference
        }
    } else {
        addDisallowedReference -disallowedReferences $disallowedReferences -disallowedReference $reference
    }
}

if ($disallowedReferences.Count -gt 0) {
    $outputArray = New-Object System.Collections.ArrayList
    $disallowedReferences.GetEnumerator() `
        | Select-Object * `
        | Select-Object -ExpandProperty Value `
        | Select-Object -Property PackageName, PackageVersion, Libraries `
        | ForEach-Object {
            $package = $_
            $_.Libraries.GetEnumerator() | Sort-Object -Property Name | ForEach-Object {
                $outputArray.Add([pscustomobject]@{
                    PackageName = $package.PackageName
                    PackageVersion = $package.PackageVersion
                    LibraryName = $_.Key
                    LibraryVersion = $_.Value
                }) > $null
            }
        }

    $vsFormattedErrorOutput = $(($outputArray | Out-String).Split("`r`n", [System.StringSplitOptions]::RemoveEmptyEntries) -join "`n : error: ")
    Write-Host " : error: Found $($outputArray.Count) disallowed reference(s).`n : error: $vsFormattedErrorOutput"
    Exit 1
}
