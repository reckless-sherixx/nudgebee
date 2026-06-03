import React, { useEffect, useRef, useState } from 'react';
import { FormControl, TextField, InputAdornment, IconButton } from '@mui/material';
import { searchSvg } from '@assets';
import PropTypes from 'prop-types';
import ClearIcon from '@mui/icons-material/Clear';
import { colors } from 'src/utils/colors';
import SafeIcon from './SafeIcon';

// Debounce onChange to avoid firing parent callbacks on every keystroke.
// Input stays responsive via local state; parent sees updates after 300ms pause.
const DEBOUNCE_MS = 300;

const CustomSearch = ({
  label = '',
  minWidth = '150px',
  maxWidth = '260px',
  ml,
  mr,
  onChange,
  onEnterPress,
  sx,
  value,
  id,
  onClear,
  disabled = false,
}) => {
  const [searchText, setSearchText] = useState(value ?? '');
  const [shouldTriggerFilter, setShouldTriggerFilter] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (shouldTriggerFilter && searchText === '' && onEnterPress) {
      onEnterPress();
      setShouldTriggerFilter(false);
    }
  }, [searchText, shouldTriggerFilter, onEnterPress]);

  const handleChange = (event) => {
    const newValue = event.target.value;
    setSearchText(newValue);
    if (onChange) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange(newValue);
      }, DEBOUNCE_MS);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      // Flush pending debounce so parent has current text before onEnterPress.
      // Use event.target.value (not searchText state, which may be stale in the
      // same tick if user types then immediately presses Enter).
      const latestValue = event.target.value;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
        if (onChange) onChange(latestValue);
      }
      if (onEnterPress) onEnterPress(latestValue);
    }
  };

  const handleClear = () => {
    setShouldTriggerFilter(true);
    setSearchText('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (onChange) {
      onChange('');
    }
    if (onClear) {
      onClear();
    }
  };

  return (
    <FormControl
      size='small'
      sx={{
        ...sx,
        borderRadius: 'var(--ds-radius-md)',
        maxWidth,
        minWidth,
        border: 'none',
        ml,
        mr,
        '&.css-1a4c7pq-MuiFormControl-root-MuiTextField-root': {
          mb: 'var(--ds-space-1)',
          fontSize: 'var(--ds-text-body-lg)',
        },
      }}
    >
      <TextField
        id={id}
        type='search'
        value={searchText}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={label}
        disabled={disabled}
        sx={{
          minWidth,
          maxWidth,
          '& input': {
            fontSize: 'var(--ds-text-body) !important',
            fontWeight: 'var(--ds-font-weight-medium)',
            color: colors.text.secondary,
            lineHeight: 1,
            padding: '0px !important',
          },
          '& ::placeholder': {
            color: colors.text.secondaryDark,
            opacity: 1,
            fontSize: 'var(--ds-text-small)',
            fontWeight: 'var(--ds-font-weight-regular)',
          },
          '& input::-webkit-search-cancel-button': {
            display: 'none',
            '-webkit-appearance': 'none',
          },
          '& input::-webkit-search-decoration': {
            display: 'none',
            '-webkit-appearance': 'none',
          },
          '& input[type="search"]::-moz-search-clear-button': {
            display: 'none',
          },
          '& input[type="search"]::-ms-clear': {
            display: 'none',
          },
          '& input[type="search"]::-ms-reveal': {
            display: 'none',
          },
        }}
        InputProps={{
          sx: {
            padding: 'var(--ds-space-2) var(--ds-space-2) !important',
            borderRadius: 'var(--ds-radius-md)',
            height: '34px !important',
            backgroundColor: colors.background.white,
            border: '1px solid #e2e2e2c4',
            boxShadow: '0 4px 4px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease',
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none !important',
            },
            '&.Mui-focused': {
              backgroundColor: colors.background.tertiaryLightest,
              boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.15)',
            },
            '&:hover:not(.Mui-focused)': {
              backgroundColor: colors.background.tertiaryLightest,
            },
          },
          startAdornment: (
            <InputAdornment position='start'>
              <SafeIcon src={searchSvg} alt={Date.now()} height={18} width={18} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position='end'>
              <IconButton
                aria-label='clear search'
                onClick={handleClear}
                edge='end'
                size='medium'
                sx={{
                  visibility: !searchText ? 'hidden' : 'visible',
                  paddingRight: 'var(--ds-space-4)',
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                }}
              >
                <ClearIcon sx={{ fontSize: 'var(--ds-text-title)' }} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </FormControl>
  );
};

CustomSearch.propTypes = {
  label: PropTypes.string,
  minWidth: PropTypes.string,
  maxWidth: PropTypes.string,
  ml: PropTypes.string,
  mr: PropTypes.string,
  onChange: PropTypes.func,
  onEnterPress: PropTypes.func,
  sx: PropTypes.object,
  value: PropTypes.string,
  id: PropTypes.string,
  onClear: PropTypes.func,
  disabled: PropTypes.bool,
};

export default CustomSearch;
