class ChessGame {
	constructor() {
		this.board = this.createInitialBoard();
		this.currentPlayer = 'white';
		this.selectedPiece = null;
		this.possibleMoves = [];
		this.moveCount = 0;
		this.initializeBoard();
		this.addEventListeners();
	}

	createInitialBoard() {
		const board = Array(8).fill(null).map(() => Array(8).fill(null));
		
		// Setup pawns
		for (let i = 0; i < 8; i++) {
			board[1][i] = { type: 'pawn', color: 'black', hasMoved: false };
			board[6][i] = { type: 'pawn', color: 'white', hasMoved: false };
		}

		// Setup other pieces
		const setupRow = (row, color) => {
			const backRow = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
			backRow.forEach((type, col) => {
				board[row][col] = { type, color, hasMoved: false };
			});
		};

		setupRow(0, 'black');
		setupRow(7, 'white');

		return board;
	}

	initializeBoard() {
		const boardElement = document.getElementById('chessBoard');
		boardElement.innerHTML = '';

		for (let row = 0; row < 8; row++) {
			for (let col = 0; col < 8; col++) {
				const square = document.createElement('div');
				square.className = `square ${(row + col) % 2 === 0 ? 'square-light' : 'square-dark'}`;
				square.dataset.row = row;
				square.dataset.col = col;

				const piece = this.board[row][col];
				if (piece) {
					const pieceElement = document.createElement('div');
					pieceElement.className = `piece ${piece.color}-${piece.type}`;
					pieceElement.innerHTML = this.getPieceUnicode(piece);
					pieceElement.draggable = true;
					square.appendChild(pieceElement);
				}

				boardElement.appendChild(square);
			}
		}

		this.updateMoveCount();
	}

	getPieceUnicode(piece) {
		const pieces = {
			white: {
				king: '♔',
				queen: '♕',
				rook: '♖',
				bishop: '♗',
				knight: '♘',
				pawn: '♙'
			},
			black: {
				king: '♚',
				queen: '♛',
				rook: '♜',
				bishop: '♝',
				knight: '♞',
				pawn: '♟'
			}
		};
		return pieces[piece.color][piece.type];
	}

	addEventListeners() {
		const board = document.getElementById('chessBoard');

		board.addEventListener('click', (e) => {
			const square = e.target.closest('.square');
			if (!square) return;

			const row = parseInt(square.dataset.row);
			const col = parseInt(square.dataset.col);
			this.handleSquareClick(row, col);
		});

		// Drag and drop events
		board.addEventListener('dragstart', (e) => {
			const square = e.target.closest('.square');
			if (!square) return;
			
			const row = parseInt(square.dataset.row);
			const col = parseInt(square.dataset.col);
			const piece = this.board[row][col];
			
			if (piece && piece.color === this.currentPlayer) {
				this.selectedPiece = { row, col };
				this.possibleMoves = this.calculatePossibleMoves(row, col);
				this.highlightPossibleMoves();
				e.target.classList.add('dragging');
			}
		});

		board.addEventListener('dragend', (e) => {
			e.target.classList.remove('dragging');
			this.clearHighlights();
		});

		board.addEventListener('dragover', (e) => {
			e.preventDefault();
		});

		board.addEventListener('drop', (e) => {
			e.preventDefault();
			const square = e.target.closest('.square');
			if (!square) return;

			const targetRow = parseInt(square.dataset.row);
			const targetCol = parseInt(square.dataset.col);

			if (this.selectedPiece) {
				const isValidMove = this.possibleMoves.some(
					move => move.row === targetRow && move.col === targetCol
				);

				if (isValidMove) {
					this.makeMove(this.selectedPiece.row, this.selectedPiece.col, targetRow, targetCol);
				}

				this.selectedPiece = null;
				this.clearHighlights();
			}
		});
	}

	handleSquareClick(row, col) {
		const piece = this.board[row][col];

		if (this.selectedPiece) {
			const isValidMove = this.possibleMoves.some(
				move => move.row === row && move.col === col
			);

			if (isValidMove) {
				this.makeMove(this.selectedPiece.row, this.selectedPiece.col, row, col);
			}

			this.selectedPiece = null;
			this.clearHighlights();
		} else if (piece && piece.color === this.currentPlayer) {
			this.selectedPiece = { row, col };
			this.possibleMoves = this.calculatePossibleMoves(row, col);
			this.highlightPossibleMoves();
		}
	}

	makeMove(fromRow, fromCol, toRow, toCol) {
		const piece = this.board[fromRow][fromCol];
		const targetSquare = this.board[toRow][toCol];

		// Capture handling
		if (targetSquare) {
			this.handleCapture(targetSquare);
		}

		// Move piece
		this.board[toRow][toCol] = piece;
		this.board[fromRow][fromCol] = null;
		piece.hasMoved = true;

		// Pawn promotion
		if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
			this.promotePawn(toRow, toCol);
		}

		this.moveCount++;
		this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
		this.updateMoveCount();
		this.initializeBoard();
	}

	handleCapture(capturedPiece) {
		const capturedElement = document.getElementById(
			`captured${capturedPiece.color === 'white' ? 'White' : 'Black'}`
		);
		const pieceElement = document.createElement('span');
		pieceElement.textContent = this.getPieceUnicode(capturedPiece);
		capturedElement.appendChild(pieceElement);
	}

	promotePawn(row, col) {
		const piece = this.board[row][col];
		piece.type = 'queen'; // Auto-promote to queen for simplicity
	}

	calculatePossibleMoves(row, col) {
		const piece = this.board[row][col];
		const moves = [];

		switch (piece.type) {
			case 'pawn':
				this.calculatePawnMoves(row, col, moves);
				break;
			case 'rook':
				this.calculateRookMoves(row, col, moves);
				break;
			case 'knight':
				this.calculateKnightMoves(row, col, moves);
				break;
			case 'bishop':
				this.calculateBishopMoves(row, col, moves);
				break;
			case 'queen':
				this.calculateQueenMoves(row, col, moves);
				break;
			case 'king':
				this.calculateKingMoves(row, col, moves);
				break;
		}

		return moves;
	}

	// Movement calculation methods for each piece type
	calculatePawnMoves(row, col, moves) {
		const direction = this.board[row][col].color === 'white' ? -1 : 1;
		const startRow = this.board[row][col].color === 'white' ? 6 : 1;

		// Forward move
		if (!this.board[row + direction]?.[col]) {
			moves.push({ row: row + direction, col });
			
			// Double move from starting position
			if (row === startRow && !this.board[row + 2 * direction]?.[col])
			{
				moves.push({ row: row + 2 * direction, col });
			}
		}

		// Capture moves
		const captureSquares = [
			{ row: row + direction, col: col - 1 },
			{ row: row + direction, col: col + 1 }
		];

		for (const square of captureSquares) {
			const piece = this.board[square.row]?.[square.col];
			if (piece && piece.color !== this.board[row][col].color) {
				moves.push(square);
			}
		}
	}

	calculateRookMoves(row, col, moves) {
		const directions = [
			[-1, 0], // Up
			[1, 0],  // Down
			[0, -1], // Left
			[0, 1]   // Right
		];

		this.calculateSlidingMoves(row, col, moves, directions);
	}

	calculateBishopMoves(row, col, moves) {
		const directions = [
			[-1, -1], // Up-left
			[-1, 1],  // Up-right
			[1, -1],  // Down-left
			[1, 1]    // Down-right
		];

		this.calculateSlidingMoves(row, col, moves, directions);
	}

	calculateQueenMoves(row, col, moves) {
		const directions = [
			[-1, 0], [1, 0], [0, -1], [0, 1], // Rook moves
			[-1, -1], [-1, 1], [1, -1], [1, 1] // Bishop moves
		];

		this.calculateSlidingMoves(row, col, moves, directions);
	}

	calculateKnightMoves(row, col, moves) {
		const knightMoves = [
			[-2, -1], [-2, 1], [-1, -2], [-1, 2],
			[1, -2], [1, 2], [2, -1], [2, 1]
		];

		for (const [rowOffset, colOffset] of knightMoves) {
			const newRow = row + rowOffset;
			const newCol = col + colOffset;

			if (this.isValidPosition(newRow, newCol)) {
				const targetPiece = this.board[newRow][newCol];
				if (!targetPiece || targetPiece.color !== this.board[row][col].color) {
					moves.push({ row: newRow, col: newCol });
				}
			}
		}
	}

	calculateKingMoves(row, col, moves) {
		const kingMoves = [
			[-1, -1], [-1, 0], [-1, 1],
			[0, -1],           [0, 1],
			[1, -1],  [1, 0],  [1, 1]
		];

		for (const [rowOffset, colOffset] of kingMoves) {
			const newRow = row + rowOffset;
			const newCol = col + colOffset;

			if (this.isValidPosition(newRow, newCol)) {
				const targetPiece = this.board[newRow][newCol];
				if (!targetPiece || targetPiece.color !== this.board[row][col].color) {
					moves.push({ row: newRow, col: newCol });
				}
			}
		}

		// Castling
		if (!this.board[row][col].hasMoved) {
			this.calculateCastlingMoves(row, col, moves);
		}
	}

	calculateCastlingMoves(row, col, moves) {
		// Kingside castling
		if (!this.board[row][7]?.hasMoved &&
			!this.board[row][6] &&
			!this.board[row][5]) {
			moves.push({ row, col: col + 2, castling: 'kingside' });
		}

		// Queenside castling
		if (!this.board[row][0]?.hasMoved &&
			!this.board[row][1] &&
			!this.board[row][2] &&
			!this.board[row][3]) {
			moves.push({ row, col: col - 2, castling: 'queenside' });
		}
	}

	calculateSlidingMoves(row, col, moves, directions) {
		const piece = this.board[row][col];

		for (const [rowDir, colDir] of directions) {
			let newRow = row + rowDir;
			let newCol = col + colDir;

			while (this.isValidPosition(newRow, newCol)) {
				const targetPiece = this.board[newRow][newCol];

				if (!targetPiece) {
					moves.push({ row: newRow, col: newCol });
				} else {
					if (targetPiece.color !== piece.color) {
						moves.push({ row: newRow, col: newCol });
					}
					break;
				}

				newRow += rowDir;
				newCol += colDir;
			}
		}
	}

	isValidPosition(row, col) {
		return row >= 0 && row < 8 && col >= 0 && col < 8;
	}

	highlightPossibleMoves() {
		const squares = document.querySelectorAll('.square');
		squares.forEach(square => square.classList.remove('selected', 'possible-move', 'possible-capture'));

		const selectedSquare = document.querySelector(
			`[data-row="${this.selectedPiece.row}"][data-col="${this.selectedPiece.col}"]`
		);
		selectedSquare?.classList.add('selected');

		this.possibleMoves.forEach(move => {
			const square = document.querySelector(
				`[data-row="${move.row}"][data-col="${move.col}"]`
			);
			if (square) {
				if (this.board[move.row][move.col]) {
					square.classList.add('possible-capture');
				} else {
					square.classList.add('possible-move');
				}
			}
		});
	}

	clearHighlights() {
		const squares = document.querySelectorAll('.square');
		squares.forEach(square => 
			square.classList.remove('selected', 'possible-move', 'possible-capture')
		);
	}

	updateMoveCount() {
		document.getElementById('moveCount').textContent = `Langkah: ${this.moveCount}`;
	}
}

// Timer class untuk mengelola waktu permainan
class ChessTimer {
	constructor(whiteTime, blackTime, onTimeUp) {
		this.whiteTime = whiteTime;
		this.blackTime = blackTime;
		this.currentPlayer = 'white';
		this.onTimeUp = onTimeUp;
		this.timerId = null;
		this.updateDisplay();
	}

	start() {
		this.timerId = setInterval(() => {
			if (this.currentPlayer === 'white') {
				this.whiteTime--;
			} else {
				this.blackTime--;
			}

			if (this.whiteTime <= 0 || this.blackTime <= 0) {
				this.stop();
				this.onTimeUp(this.currentPlayer);
			}

			this.updateDisplay();
		}, 1000);
	}

	stop() {
		if (this.timerId) {
			clearInterval(this.timerId);
			this.timerId = null;
		}
	}

	switchPlayer() {
		this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
	}

	updateDisplay() {
		document.getElementById('whiteTimer').textContent = this.formatTime(this.whiteTime);
		document.getElementById('blackTimer').textContent = this.formatTime(this.blackTime);
	}

	formatTime(seconds) {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
	}
}

// Inisialisasi permainan
const game = new ChessGame();
const timer = new ChessTimer(600, 600, (player) => {
	alert(`Waktu habis! ${player === 'white' ? 'Hitam' : 'Putih'} menang!`);
	game.gameOver = true;
});

// Mulai timer
timer.start();

// Sound effects
const moveSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
const captureSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');

// Fungsi untuk memainkan suara
function playMoveSound() {
	moveSound.currentTime = 0;
	moveSound.play().catch(() => {});
}

function playCaptureSound() {
	captureSound.currentTime = 0;
	captureSound.play().catch(() => {});
}